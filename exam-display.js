/**
 * 公務員試験表示システム
 * exam-display.js
 */

class ExamDisplaySystem {
    constructor() {
        this.apiEndpoint = '/wp-json/wp/v2/exam-api'; // WordPressのREST API エンドポイント
        this.init();
    }

    init() {
        // DOMが読み込まれたら実行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeShortcodes());
        } else {
            this.initializeShortcodes();
        }
    }

    // ショートコード風の要素を検索して初期化
    initializeShortcodes() {
        const examContainers = document.querySelectorAll('[data-exam-display]');
        examContainers.forEach(container => {
            this.renderExamList(container);
        });
    }

    // 試験一覧を表示
    async renderExamList(container) {
        const municipality = container.dataset.municipality || '';
        const prefecture = container.dataset.prefecture || '';
        const limit = parseInt(container.dataset.limit) || 50;
        const style = container.dataset.style || 'card';

        try {
            // ローディング表示
            container.innerHTML = this.getLoadingHTML();

            // データ取得（実際の実装では適切なAPIエンドポイントを使用）
            const examData = await this.fetchExamData(municipality, prefecture, limit);

            if (!examData || examData.length === 0) {
                container.innerHTML = this.getNoResultsHTML();
                return;
            }

            // スタイル別レンダリング
            switch (style) {
                case 'table':
                    container.innerHTML = this.renderTableStyle(examData, municipality);
                    break;
                case 'list':
                    container.innerHTML = this.renderListStyle(examData, municipality);
                    break;
                case 'card':
                default:
                    container.innerHTML = this.renderCardStyle(examData, municipality);
            }

            // イベントリスナー追加
            this.addEventListeners(container);

        } catch (error) {
            console.error('試験データの取得に失敗:', error);
            container.innerHTML = this.getErrorHTML();
        }
    }

    // データ取得（模擬実装 - 実際はWordPressのデータベースから取得）
    async fetchExamData(municipality, prefecture, limit) {
        // 実際の実装では、WordPressのREST APIまたはAJAXでデータベースにアクセス
        // 現在は模擬データを返す
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.getMockData(municipality));
            }, 500);
        });
    }

    // カードスタイルのレンダリング
    renderCardStyle(examData, municipality) {
        const html = `
            <div class="exam-list-container">
                <div class="exam-list-header">
                    <h2 class="municipality-title">${municipality} 公務員試験一覧</h2>
                    <p class="exam-count">募集中の試験: <strong>${examData.length}件</strong></p>
                </div>
                <div class="exam-cards-grid">
                    ${examData.map(exam => this.createExamCard(exam)).join('')}
                </div>
            </div>
        `;
        return html;
    }

    // 試験カードの作成
    createExamCard(exam) {
        const statusClass = this.getExamStatus(exam.application_end);
        const remainingDays = this.getRemainingDays(exam.application_end);
        
        return `
            <div class="exam-card ${statusClass}">
                <div class="exam-card-header">
                    <h3 class="exam-title">${exam.exam_title}</h3>
                    <span class="exam-status ${statusClass}">
                        ${this.getStatusText(statusClass, remainingDays)}
                    </span>
                </div>
                
                <div class="exam-card-body">
                    <div class="exam-info-item">
                        <span class="exam-label">募集職種:</span>
                        <span class="exam-value job-categories">${exam.job_categories}</span>
                    </div>
                    
                    <div class="exam-info-item">
                        <span class="exam-label">申込期間:</span>
                        <span class="exam-value application-period">
                            ${exam.application_start} ～ ${exam.application_end}
                        </span>
                    </div>
                    
                    <div class="exam-info-item">
                        <span class="exam-label">第1次試験:</span>
                        <span class="exam-value exam-date">${exam.first_exam_date}</span>
                    </div>
                </div>
                
                <div class="exam-card-footer">
                    <a href="${exam.official_url}" target="_blank" rel="noopener" class="exam-link-btn">
                        <span>詳細・申込</span>
                        <svg class="external-link-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15,3 21,3 21,9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>
            </div>
        `;
    }

    // テーブルスタイルのレンダリング
    renderTableStyle(examData, municipality) {
        return `
            <div class="exam-list-container">
                <div class="exam-list-header">
                    <h2 class="municipality-title">${municipality} 公務員試験一覧</h2>
                    <p class="exam-count">募集中の試験: <strong>${examData.length}件</strong></p>
                </div>
                <div class="exam-table-container">
                    <table class="exam-table">
                        <thead>
                            <tr>
                                <th>試験名</th>
                                <th>募集職種</th>
                                <th>申込期間</th>
                                <th>第1次試験</th>
                                <th>詳細</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${examData.map(exam => `
                                <tr class="exam-row ${this.getExamStatus(exam.application_end)}">
                                    <td class="exam-title-cell">${exam.exam_title}</td>
                                    <td class="job-categories-cell">${exam.job_categories}</td>
                                    <td class="application-period-cell">${exam.application_start}<br>～ ${exam.application_end}</td>
                                    <td class="exam-date-cell">${exam.first_exam_date}</td>
                                    <td class="action-cell">
                                        <a href="${exam.official_url}" target="_blank" rel="noopener" class="exam-link-btn-small">詳細</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // 試験の状態を判定
    getExamStatus(applicationEnd) {
        const today = new Date();
        const endDate = new Date(applicationEnd);
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'expired';
        if (diffDays <= 7) return 'urgent';
        if (diffDays <= 30) return 'soon';
        return 'available';
    }

    // 残り日数を計算
    getRemainingDays(applicationEnd) {
        const today = new Date();
        const endDate = new Date(applicationEnd);
        const diffTime = endDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // ステータステキストを取得
    getStatusText(status, remainingDays) {
        switch (status) {
            case 'expired': return '締切済';
            case 'urgent': return `残り${remainingDays}日`;
            case 'soon': return `残り${remainingDays}日`;
            case 'available': return '募集中';
            default: return '';
        }
    }

    // ローディングHTML
    getLoadingHTML() {
        return `
            <div class="exam-loading">
                <div class="loading-spinner"></div>
                <p>試験情報を読み込み中...</p>
            </div>
        `;
    }

    // 結果なしHTML
    getNoResultsHTML() {
        return `
            <div class="exam-no-results">
                <p>現在、募集中の試験はありません。</p>
            </div>
        `;
    }

    // エラーHTML
    getErrorHTML() {
        return `
            <div class="exam-error">
                <p>試験情報の取得に失敗しました。しばらく時間をおいて再度お試しください。</p>
            </div>
        `;
    }

    // イベントリスナー追加
    addEventListeners(container) {
        // フィルタ機能やソート機能のイベントリスナーをここに追加
        const filterButtons = container.querySelectorAll('.exam-filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilter(e, container);
            });
        });
    }

    // 模擬データ（実際の実装では削除）
    getMockData(municipality) {
        const mockData = [
            {
                exam_title: "大学卒業程度",
                job_categories: "行政、技術、専門職",
                application_start: "2025年4月1日",
                application_end: "2025年5月15日",
                first_exam_date: "2025年6月15日",
                official_url: "https://example.com"
            },
            {
                exam_title: "高校卒業程度",
                job_categories: "事務、技術",
                application_start: "2025年7月1日",
                application_end: "2025年8月15日",
                first_exam_date: "2025年9月28日",
                official_url: "https://example.com"
            }
        ];
        return mockData;
    }
}

// システム初期化
const examDisplaySystem = new ExamDisplaySystem();

// グローバル関数として公開（必要に応じて）
window.ExamDisplaySystem = ExamDisplaySystem;
