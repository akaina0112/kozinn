document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const urls = document.getElementById('urls').value.split('\n').filter(url => url.trim());
    if (urls.length === 0) {
        alert('URLを入力してください');
        return;
    }

    const loading = document.querySelector('.loading');
    const results = document.getElementById('results');
    
    loading.style.display = 'block';
    results.innerHTML = '';

    try {
        for (const url of urls) {
            const productId = extractProductId(url);
            if (!productId) {
                showError(`無効なURLです: ${url}`);
                continue;
            }

            const reviews = await fetchReviews(productId);
            const analysis = analyzeReviews(reviews);
            displayResults(url, analysis);
        }
    } catch (error) {
        showError('レビューの取得中にエラーが発生しました');
        console.error(error);
    } finally {
        loading.style.display = 'none';
    }
});

function extractProductId(url) {
    const match = url.match(/\/dp\/([A-Z0-9]{10})/);
    return match ? match[1] : null;
}

async function fetchReviews(productId) {
    // 実際の実装では、AmazonのAPIを使用するか、スクレイピングを行う必要があります
    // この例では、モックデータを返します
    return [
        {
            rating: 5,
            date: '2024-01-01',
            content: 'とても良い商品です。期待通りでした。',
            verified: true
        },
        {
            rating: 1,
            date: '2024-01-02',
            content: '期待外れでした。返品します。',
            verified: true
        },
        // より多くのレビューデータを追加
    ];
}

function analyzeReviews(reviews) {
    const totalReviews = reviews.length;
    const verifiedReviews = reviews.filter(r => r.verified).length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    
    // 感情分析（簡易版）
    const positiveWords = ['良い', '最高', '素晴らしい', '満足', 'おすすめ'];
    const negativeWords = ['悪い', '最悪', '不満', '返品', '失敗'];
    
    const sentimentScores = reviews.map(review => {
        let score = 0;
        positiveWords.forEach(word => {
            if (review.content.includes(word)) score += 1;
        });
        negativeWords.forEach(word => {
            if (review.content.includes(word)) score -= 1;
        });
        return score;
    });

    const averageSentiment = sentimentScores.reduce((sum, score) => sum + score, 0) / totalReviews;

    return {
        totalReviews,
        verifiedReviews,
        averageRating,
        averageSentiment,
        reliability: calculateReliability(reviews, averageSentiment)
    };
}

function calculateReliability(reviews, averageSentiment) {
    // 信頼性スコアの計算（0-100）
    const verifiedRatio = reviews.filter(r => r.verified).length / reviews.length;
    const ratingConsistency = 1 - (Math.std(reviews.map(r => r.rating)) / 5);
    const sentimentScore = (averageSentiment + 5) / 10; // -5 to 5 を 0 to 1 に変換

    return Math.round((verifiedRatio * 0.4 + ratingConsistency * 0.3 + sentimentScore * 0.3) * 100);
}

function displayResults(url, analysis) {
    const results = document.getElementById('results');
    const productId = extractProductId(url);
    
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
        <div class="review-header">
            <h3>商品ID: ${productId}</h3>
            <div class="review-rating">信頼性スコア: ${analysis.reliability}%</div>
        </div>
        <div class="review-content">
            <p>総レビュー数: ${analysis.totalReviews}</p>
            <p>認証済みレビュー: ${analysis.verifiedReviews}</p>
            <p>平均評価: ${analysis.averageRating.toFixed(1)}/5.0</p>
        </div>
        <div class="review-analysis">
            <h4>分析結果</h4>
            <p>この商品のレビューは${analysis.reliability >= 70 ? '信頼性が高い' : '信頼性に疑問がある'}と判断されます。</p>
            <p>主な理由:</p>
            <ul>
                <li>認証済みレビューの割合: ${((analysis.verifiedReviews / analysis.totalReviews) * 100).toFixed(1)}%</li>
                <li>評価の一貫性: ${(analysis.averageRating / 5 * 100).toFixed(1)}%</li>
                <li>レビュー内容の感情分析: ${analysis.averageSentiment > 0 ? 'ポジティブ' : 'ネガティブ'}</li>
            </ul>
        </div>
    `;
    
    results.appendChild(card);
}

function showError(message) {
    const results = document.getElementById('results');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    results.appendChild(errorDiv);
}

// 標準偏差の計算
Math.std = function(array) {
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}; 