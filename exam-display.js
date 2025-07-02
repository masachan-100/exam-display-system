// exam-display.js - グループ化表示システム

(function() {
    'use strict';

    // 設定
    const API_URL = 'https://haikakin.com/api/exam-api.php';
    const DETAIL_BASE_URL = 'https://masablog100.com/koumuin_shiken/';

    // DOM読み込み完了時に実行
    document.addEventListener('DOMContentLoaded', function() {
        const containers = document.querySelectorAll('[data-municipality]');
        containers.forEach(container => {
            const municipality = container.getAttribute('data-municipality');
            if (municipality) {
                loadExamData(municipality, container);
            }
        });
    });

    // 試験データを取得
    async function loadExamData(municipality, container) {
        try {
            showLoading(container);
            
            const response = await fetch(`${API_URL}?municipality=${encodeURIComponent(municipality)}`);
            if (!response.ok) {
                throw new Error('データの取得に失敗しました');
            }
            
            const data = await response.json();
            displayGroupedExams(data, container, municipality);
            
        } catch (error) {
            showError(container, error.message);
        }
    }

    // グループ化して表示
    function displayGroupedExams(examData, container, municipality) {
        if (!examData || examData.length === 0) {
            container.innerHTML = '<div class="no-data">該当する試験情報がありません</div>';
            return;
        }

        // exam_typeでグループ化
        const groupedData = groupByExamType(examData);
        
        const html = Object.entries(groupedData).map(([examType, exams]) => {
            return createExamGroupCard(examType, exams, municipality);
        }).join('');

        container.innerHTML = `<div class="exam-groups">${html}</div>`;
    }

    // exam_typeでグループ化する関数
    function groupByExamType(examData) {
        const groups = {};
        examData.forEach(exam => {
            const examType = exam.exam_type || '未分類';
            if (!groups[examType]) {
                groups[examType] = [];
            }
            groups[examType].push(exam);
        });
        return groups;
    }

    // 試験グループカードを作成
    function createExamGroupCard(examType, exams, municipality) {
        // 基本情報（最初の試験から取得）
        const firstExam = exams[0];
        const examDate = formatDate(firstExam.exam_date);
        const applicationPeriod = getApplicationPeriod(firstExam);
        const status = getExamStatus(firstExam);
        
        // 職種一覧を作成
        const positionsList = exams.map(exam => {
            const latestResult = getLatestResult(exam.examResults);
            const ratio = latestResult ? `${latestResult.ratio}倍` : '';
            const recruitNum = exam.recruit_number || '';
            
            return `
                <div class="position-item">
                    <span class="position-name">${exam.position}</span>
                    <span class="position-details">
                        ${recruitNum ? `${recruitNum}` : ''}
                        ${ratio ? ` • ${ratio}` : ''}
                    </span>
                </div>
            `;
        }).join('');

        // クリック時のURL生成
        const detailUrl = generateDetailUrl(municipality, examType);

        return `
            <div class="exam-group-card" onclick="navigateToDetail('${detailUrl}')" style="cursor: pointer;">
                <div class="exam-header">
                    <h3 class="exam-type">${examType}</h3>
                    <span class="exam-status ${status.class}">${status.text}</span>
                </div>
                
                <div class="exam-basic-info">
                    <div class="info-item">
                        <span class="info-label">試験日:</span>
                        <span class="info-value">${examDate}</span>
                    </div>
                    ${applicationPeriod ? `
                    <div class="info-item">
                        <span class="info-label">申込:</span>
                        <span class="info-value">${applicationPeriod}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="positions-section">
                    <h4 class="positions-title">募集職種 (${exams.length}職種)</h4>
                    <div class="positions-list">
                        ${positionsList}
                    </div>
                </div>

                <div class="card-footer">
                    <span class="detail-link">詳細を見る →</span>
                </div>
            </div>
        `;
    }

    // 詳細ページへのURL生成
    function generateDetailUrl(municipality, examType) {
        const urlPath = `${municipality}-${examType}`
            .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        return `${DETAIL_BASE_URL}${encodeURIComponent(urlPath)}/`;
    }

    // 詳細ページに遷移
    window.navigateToDetail = function(url) {
        window.open(url, '_blank');
    };

    // 最新の試験結果を取得
    function getLatestResult(results) {
        if (!results || results.length === 0) return null;
        
        // 年度順でソート（令和6年度が最新）
        const sorted = results.sort((a, b) => {
            const yearA = parseInt(a.year.replace(/[^\d]/g, ''));
            const yearB = parseInt(b.year.replace(/[^\d]/g, ''));
            return yearB - yearA;
        });
        
        return sorted[0];
    }

    // 試験ステータスを判定
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

    // 申込期間を取得
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

    // 日付をフォーマット
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        return `${year}年${month}月${day}日`;
    }

    // ローディング表示
    function showLoading(container) {
        container.innerHTML = '<div class="loading">読み込み中...</div>';
    }

    // エラー表示
    function showError(container, message) {
        container.innerHTML = `<div class="error">エラー: ${message}</div>`;
    }

})();

// CSS スタイル
const style = document.createElement('style');
style.textContent = `
    .exam-groups {
        display: flex;
        flex-direction: column;
        gap: 20px;
        margin: 20px 0;
    }

    .exam-group-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }

    .exam-group-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        border-color: #4299e1;
    }

    .exam-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f7fafc;
    }

    .exam-type {
        font-size: 1.4rem;
        font-weight: 700;
        color: #2d3748;
        margin: 0;
    }

    .exam-status {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
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

    .exam-basic-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
    }

    .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .info-label {
        font-weight: 600;
        color: #4a5568;
        min-width: 60px;
    }

    .info-value {
        color: #2d3748;
    }

    .positions-section {
        margin-bottom: 20px;
    }

    .positions-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #4a5568;
        margin: 0 0 12px 0;
    }

    .positions-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 8px;
    }

    .position-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: #f7fafc;
        border-radius: 6px;
        border-left: 3px solid #4299e1;
    }

    .position-name {
        font-weight: 600;
        color: #2d3748;
    }

    .position-details {
        font-size: 0.9rem;
        color: #718096;
    }

    .card-footer {
        text-align: right;
        padding-top: 16px;
        border-top: 1px solid #f7fafc;
    }

    .detail-link {
        color: #4299e1;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .loading, .error, .no-data {
        text-align: center;
        padding: 40px 20px;
        color: #718096;
        font-size: 1.1rem;
    }

    .error {
        color: #e53e3e;
        background: #fed7cc;
        border-radius: 8px;
    }

    /* レスポンシブ対応 */
    @media (max-width: 768px) {
        .exam-group-card {
            padding: 16px;
        }
        
        .exam-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
        }
        
        .exam-basic-info {
            grid-template-columns: 1fr;
        }
        
        .positions-list {
            grid-template-columns: 1fr;
        }
        
        .position-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }
    }
`;

document.head.appendChild(style);
