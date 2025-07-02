// exam-detail.js - 試験詳細ページシステム

(function() {
    'use strict';

    // 設定
    const API_URL = 'https://haikakin.com/api/exam-api.php';

    // DOM読み込み完了時に実行
    document.addEventListener('DOMContentLoaded', function() {
        const container = document.getElementById('exam-detail-root');
        if (container) {
            // data属性から取得を優先
            const municipality = container.getAttribute('data-municipality');
            const examType = container.getAttribute('data-exam-type');
            
            if (municipality && examType) {
                console.log('data属性から取得:', { municipality, examType });
                loadExamDetailDirect(container, municipality, examType);
            } else {
                loadExamDetail(container);
            }
        }
    });

    // 直接指定されたパラメータで詳細データを読み込み
    async function loadExamDetailDirect(container, municipality, examType) {
        try {
            showLoading(container);
            
            const response = await fetch(`${API_URL}?municipality=${encodeURIComponent(municipality)}`);
            if (!response.ok) {
                throw new Error('データの取得に失敗しました');
            }
            
            const allData = await response.json();
            const examData = filterByExamType(allData, examType);
            
            if (examData.length === 0) {
                showError(container, '該当する試験情報が見つかりません');
                return;
            }

            displayExamDetail(examData, container, { municipality, examType });
            
        } catch (error) {
            showError(container, error.message);
        }
    }

    // URLから自治体名と試験種を取得して詳細データを読み込み
    async function loadExamDetail(container) {
        try {
            const urlParams = getUrlParams();
            
            // デバッグ用ログ
            console.log('URL:', window.location.pathname);
            console.log('解析結果:', urlParams);
            
            if (!urlParams.municipality || !urlParams.examType) {
                // URLパラメータが取得できない場合の代替処理
                console.log('URLパラメータが不正です。代替処理を実行します。');
                
                // 全データを取得して表示（デバッグ用）
                const allMunicipalities = ['川越市', '札幌市']; // 既知の自治体
                for (const municipality of allMunicipalities) {
                    try {
                        const response = await fetch(`${API_URL}?municipality=${encodeURIComponent(municipality)}`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data.length > 0) {
                                console.log(`${municipality}のデータ:`, data);
                                displayExamDetail(data, container, { municipality, examType: data[0].exam_type });
                                return;
                            }
                        }
                    } catch (e) {
                        console.log(`${municipality}のデータ取得に失敗:`, e);
                    }
                }
                
                showError(container, 'URLパラメータが不正です。正しいURLでアクセスしてください。');
                return;
            }

            showLoading(container);
            
            const response = await fetch(`${API_URL}?municipality=${encodeURIComponent(urlParams.municipality)}`);
            if (!response.ok) {
                throw new Error('データの取得に失敗しました');
            }
            
            const allData = await response.json();
            const examData = filterByExamType(allData, urlParams.examType);
            
            if (examData.length === 0) {
                showError(container, '該当する試験情報が見つかりません');
                return;
            }

            displayExamDetail(examData, container, urlParams);
            
        } catch (error) {
            showError(container, error.message);
        }
    }

    // URLパラメータを解析
    function getUrlParams() {
        const path = window.location.pathname;
        console.log('現在のパス:', path);
        
        // パターン1: /koumuin_shiken/札幌市-大学卒業程度/ 形式
        const cleanPath = path.replace(/\/$/, '');
        const pathParts = cleanPath.split('/');
        console.log('パス分割:', pathParts);
        
        // 最後の部分を取得
        const lastPart = pathParts[pathParts.length - 1];
        console.log('最後の部分:', lastPart);
        
        if (lastPart && lastPart.includes('-')) {
            const dashIndex = lastPart.indexOf('-');
            const result = {
                municipality: lastPart.substring(0, dashIndex),
                examType: decodeURIComponent(lastPart.substring(dashIndex + 1))
            };
            console.log('パターン1で解析:', result);
            return result;
        }
        
        // パターン2: WordPress固定ページのスラッグから推測
        if (pathParts.length >= 2) {
            const slug = pathParts[pathParts.length - 1];
            if (slug.includes('川越市') || slug.includes('kawagoe')) {
                console.log('川越市として処理');
                return { municipality: '川越市', examType: '行政職員採用試験' };
            }
            if (slug.includes('札幌市') || slug.includes('sapporo')) {
                console.log('札幌市として処理');
                return { municipality: '札幌市', examType: '職員採用試験（大学の部・一般方式）' };
            }
        }
        
        // パターン3: URLパラメータから取得
        const urlParams = new URLSearchParams(window.location.search);
        const result3 = {
            municipality: urlParams.get('municipality'),
            examType: urlParams.get('examType')
        };
        console.log('パターン3で解析:', result3);
        
        return result3;
    }

    // 試験種でフィルタリング
    function filterByExamType(allData, examType) {
        return allData.filter(exam => exam.exam_type === examType);
    }

    // 詳細ページを表示
    function displayExamDetail(examData, container, params) {
        const firstExam = examData[0];
        
        // ページタイトルを設定
        document.title = `${params.municipality} ${params.examType} | 公務員試験情報`;

        const html = `
            <div class="exam-detail-container">
                <!-- ヘッダー部分 -->
                <div class="detail-header">
                    <h1 class="detail-title">${params.municipality} ${params.examType}</h1>
                    <div class="exam-summary">
                        ${createExamSummary(firstExam)}
                    </div>
                </div>

                <!-- 職種一覧 -->
                <div class="positions-section">
                    <h2 class="section-title">募集職種・詳細情報</h2>
                    <div class="positions-grid">
                        ${examData.map(exam => createPositionCard(exam)).join('')}
                    </div>
                </div>

                <!-- 試験スケジュール -->
                <div class="schedule-section">
                    <h2 class="section-title">試験スケジュール</h2>
                    ${createScheduleInfo(firstExam)}
                </div>

                <!-- 試験内容 -->
                ${createTestContent(examData)}

                <!-- 過去の試験結果 -->
                ${createResultsSection(examData)}

                <!-- 公式サイト -->
                ${firstExam.official_url ? createOfficialLink(firstExam.official_url) : ''}
            </div>
        `;

        container.innerHTML = html;
    }

    // 試験概要を生成
    function createExamSummary(exam) {
        const status = getExamStatus(exam);
        const examDate = formatDate(exam.exam_date);
        const applicationPeriod = getApplicationPeriod(exam);

        return `
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-label">ステータス</span>
                    <span class="exam-status ${status.class}">${status.text}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">試験日</span>
                    <span class="summary-value">${examDate}</span>
                </div>
                ${applicationPeriod ? `
                <div class="summary-item">
                    <span class="summary-label">申込期間</span>
                    <span class="summary-value">${applicationPeriod}</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    // 職種カードを生成
    function createPositionCard(exam) {
        const latestResult = getLatestResult(exam.examResults);
        
        return `
            <div class="position-card">
                <div class="position-header">
                    <h3 class="position-name">${exam.position}</h3>
                    ${exam.recruit_number ? `<span class="recruit-number">${exam.recruit_number}</span>` : ''}
                </div>
                
                ${exam.age_requirement ? `
                <div class="position-detail">
                    <span class="detail-label">年齢要件</span>
                    <span class="detail-value">${exam.age_requirement}</span>
                </div>
                ` : ''}

                ${latestResult ? `
                <div class="latest-result">
                    <span class="result-label">最新結果（${latestResult.year}）</span>
                    <div class="result-stats">
                        <span class="stat">受験者: ${latestResult.applicants}名</span>
                        <span class="stat">合格者: ${latestResult.successful}名</span>
                        <span class="stat ratio">倍率: ${latestResult.ratio}倍</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // スケジュール情報を生成
    function createScheduleInfo(exam) {
        const items = [];
        
        if (exam.application_start) {
            items.push({
                label: '申込開始',
                value: formatDate(exam.application_start),
                icon: '📝'
            });
        }
        
        if (exam.application_end) {
            items.push({
                label: '申込締切',
                value: formatDate(exam.application_end),
                icon: '⏰'
            });
        }
        
        if (exam.exam_date) {
            items.push({
                label: '試験日',
                value: formatDate(exam.exam_date),
                icon: '📋'
            });
        }

        return `
            <div class="schedule-timeline">
                ${items.map(item => `
                    <div class="schedule-item">
                        <div class="schedule-icon">${item.icon}</div>
                        <div class="schedule-content">
                            <span class="schedule-label">${item.label}</span>
                            <span class="schedule-value">${item.value}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 試験内容セクションを生成
    function createTestContent(examData) {
        // 試験内容が設定されている試験を取得
        const testsWithContent = examData.filter(exam => 
            exam.first_test || exam.second_test || exam.third_test
        );

        if (testsWithContent.length === 0) {
            return '';
        }

        return `
            <div class="test-content-section">
                <h2 class="section-title">試験内容</h2>
                <div class="test-content-grid">
                    ${testsWithContent.map(exam => `
                        <div class="test-content-card">
                            <h4 class="test-position">${exam.position}</h4>
                            ${exam.first_test ? `
                                <div class="test-stage">
                                    <span class="stage-label">第1次試験</span>
                                    <span class="stage-content">${exam.first_test}</span>
                                </div>
                            ` : ''}
                            ${exam.second_test ? `
                                <div class="test-stage">
                                    <span class="stage-label">第2次試験</span>
                                    <span class="stage-content">${exam.second_test}</span>
                                </div>
                            ` : ''}
                            ${exam.third_test ? `
                                <div class="test-stage">
                                    <span class="stage-label">第3次試験</span>
                                    <span class="stage-content">${exam.third_test}</span>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 過去結果セクションを生成
    function createResultsSection(examData) {
        const resultsData = examData.filter(exam => 
            exam.examResults && exam.examResults.length > 0
        );

        if (resultsData.length === 0) {
            return '';
        }

        return `
            <div class="results-section">
                <h2 class="section-title">過去の試験結果</h2>
                <div class="results-grid">
                    ${resultsData.map(exam => createResultTable(exam)).join('')}
                </div>
            </div>
        `;
    }

    // 結果テーブルを生成
    function createResultTable(exam) {
        return `
            <div class="result-table-container">
                <h4 class="result-position">${exam.position}</h4>
                <div class="result-table">
                    <div class="table-header">
                        <span>年度</span>
                        <span>受験者数</span>
                        <span>合格者数</span>
                        <span>倍率</span>
                    </div>
                    ${exam.examResults.map(result => `
                        <div class="table-row">
                            <span class="year">${result.year}</span>
                            <span class="applicants">${result.applicants}名</span>
                            <span class="successful">${result.successful}名</span>
                            <span class="ratio">${result.ratio}倍</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 公式サイトリンクを生成
    function createOfficialLink(url) {
        return `
            <div class="official-link-section">
                <h2 class="section-title">公式サイト</h2>
                <a href="${url}" target="_blank" class="official-link">
                    <span class="link-icon">🔗</span>
                    <span class="link-text">公式サイトで詳細を確認</span>
                    <span class="external-icon">↗</span>
                </a>
            </div>
        `;
    }

    // ユーティリティ関数（一覧表示と同じ）
    function getLatestResult(results) {
        if (!results || results.length === 0) return null;
        
        const sorted = results.sort((a, b) => {
            const yearA = parseInt(a.year.replace(/[^\d]/g, ''));
            const yearB = parseInt(b.year.replace(/[^\d]/g, ''));
            return yearB - yearA;
        });
        
        return sorted[0];
    }

    function getExamStatus(exam) {
        const now = new Date();
        const applicationEnd = exam.application_end ? new Date(exam.application_end) : null;
        const examDate = exam.exam_date ? new Date(exam.exam_date) : null;

        if (applicationEnd && now < applicationEnd) {
            return { text: '募集中', class: 'status-active' };
        } else if (examDate && now < examDate) {
            return { text: '募集終了', class: 'status-closed' };
        } else if (examDate && now > examDate) {
            return { text: '試験終了', class: 'status-finished' };
        } else {
            return { text: '募集前', class: 'status-upcoming' };
        }
    }

    function getApplicationPeriod(exam) {
        if (!exam.application_start && !exam.application_end) return null;
        
        const start = exam.application_start ? formatDate(exam.application_start) : '';
        const end = exam.application_end ? formatDate(exam.application_end) : '';
        
        if (start && end) {
            return `${start} ～ ${end}`;
        } else if (end) {
            return `～ ${end}`;
        } else if (start) {
            return `${start} ～`;
        }
        return null;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        return `${year}年${month}月${day}日`;
    }

    function showLoading(container) {
        container.innerHTML = '<div class="loading">読み込み中...</div>';
    }

    function showError(container, message) {
        container.innerHTML = `<div class="error">エラー: ${message}</div>`;
    }

})();

// CSS スタイル
const style = document.createElement('style');
style.textContent = `
    .exam-detail-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .detail-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px;
        border-radius: 16px;
        margin-bottom: 40px;
    }

    .detail-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0 0 24px 0;
        text-align: center;
    }

    .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
    }

    .summary-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .summary-label {
        font-size: 0.9rem;
        opacity: 0.9;
        margin-bottom: 8px;
    }

    .summary-value {
        font-size: 1.1rem;
        font-weight: 600;
    }

    .exam-status {
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .status-active {
        background: #c6f6d5;
        color: #22543d;
    }

    .status-upcoming {
        background: #bee3f8;
        color: #2a4365;
    }

    .status-closed {
        background: #fed7cc;
        color: #9c4221;
    }

    .status-finished {
        background: #e2e8f0;
        color: #4a5568;
    }

    .section-title {
        font-size: 1.8rem;
        font-weight: 700;
        color: #2d3748;
        margin: 40px 0 24px 0;
        padding-bottom: 12px;
        border-bottom: 3px solid #4299e1;
    }

    .positions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 24px;
        margin-bottom: 40px;
    }

    .position-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .position-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f7fafc;
    }

    .position-name {
        font-size: 1.3rem;
        font-weight: 700;
        color: #2d3748;
        margin: 0;
    }

    .recruit-number {
        background: #4299e1;
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .position-detail {
        margin-bottom: 16px;
    }

    .detail-label {
        display: block;
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 4px;
    }

    .detail-value {
        color: #2d3748;
        line-height: 1.5;
    }

    .latest-result {
        background: #f7fafc;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #4299e1;
    }

    .result-label {
        display: block;
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 8px;
    }

    .result-stats {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }

    .stat {
        font-size: 0.9rem;
        color: #2d3748;
    }

    .stat.ratio {
        font-weight: 700;
        color: #4299e1;
    }

    .schedule-timeline {
        display: flex;
        gap: 40px;
        justify-content: center;
        margin: 40px 0;
        flex-wrap: wrap;
    }

    .schedule-item {
        display: flex;
        align-items: center;
        gap: 12px;
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #4299e1;
    }

    .schedule-icon {
        font-size: 1.5rem;
    }

    .schedule-content {
        display: flex;
        flex-direction: column;
    }

    .schedule-label {
        font-size: 0.9rem;
        color: #718096;
        margin-bottom: 4px;
    }

    .schedule-value {
        font-weight: 600;
        color: #2d3748;
    }

    .test-content-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 24px;
    }

    .test-content-card {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .test-position {
        font-size: 1.2rem;
        font-weight: 700;
        color: #2d3748;
        margin: 0 0 16px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid #f7fafc;
    }

    .test-stage {
        margin-bottom: 16px;
    }

    .stage-label {
        display: block;
        font-weight: 600;
        color: #4299e1;
        margin-bottom: 8px;
    }

    .stage-content {
        color: #2d3748;
        line-height: 1.6;
    }

    .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 24px;
    }

    .result-table-container {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .result-position {
        font-size: 1.2rem;
        font-weight: 700;
        color: #2d3748;
        margin: 0 0 16px 0;
        padding-bottom: 12px;
        border-bottom: 2px solid #f7fafc;
    }

    .result-table {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 1px;
        background: #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
    }

    .table-header {
        display: contents;
    }

    .table-header > span {
        background: #4299e1;
        color: white;
        padding: 12px;
        font-weight: 600;
        text-align: center;
    }

    .table-row {
        display: contents;
    }

    .table-row > span {
        background: white;
        padding: 12px;
        text-align: center;
    }

    .table-row .ratio {
        font-weight: 700;
        color: #4299e1;
    }

    .official-link-section {
        margin-top: 40px;
        text-align: center;
    }

    .official-link {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 16px 32px;
        background: linear-gradient(135deg, #4299e1, #3182ce);
        color: white;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        font-size: 1.1rem;
        transition: all 0.3s ease;
    }

    .official-link:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(66, 153, 225, 0.3);
    }

    .loading, .error {
        text-align: center;
        padding: 40px 20px;
        font-size: 1.1rem;
    }

    .error {
        color: #e53e3e;
        background: #fed7cc;
        border-radius: 8px;
        margin: 20px;
    }

    /* レスポンシブ対応 */
    @media (max-width: 768px) {
        .exam-detail-container {
            padding: 10px;
        }
        
        .detail-header {
            padding: 24px;
        }
        
        .detail-title {
            font-size: 2rem;
        }
        
        .positions-grid,
        .test-content-grid,
        .results-grid {
            grid-template-columns: 1fr;
        }
        
        .schedule-timeline {
            flex-direction: column;
            align-items: center;
        }
        
        .result-table {
            grid-template-columns: 1fr;
        }
        
        .table-header > span,
        .table-row > span {
            text-align: left;
            padding: 8px 12px;
        }
        
        .table-header > span:before,
        .table-row > span:before {
            content: attr(data-label) ': ';
            font-weight: 600;
            margin-right: 8px;
        }
    }
`;

document.head.appendChild(style);
