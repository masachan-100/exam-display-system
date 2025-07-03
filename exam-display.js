// 公務員試験情報表示システム（要約表示モード対応版）
(function() {
  'use strict';

  // React要素作成用のヘルパー
  const e = React.createElement;
  const { useState, useEffect } = React;

  // アイコンコンポーネント
  const Calendar = () => e('svg', {
    className: 'h-4 w-4',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, e('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
  }));

  const Users = () => e('svg', {
    className: 'h-4 w-4',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, e('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
  }));

  const ExternalLink = () => e('svg', {
    className: 'h-4 w-4',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, e('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
  }));

  const TrendingUp = () => e('svg', {
    className: 'h-5 w-5',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, e('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
  }));

  const FileText = () => e('svg', {
    className: 'h-4 w-4',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, e('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  }));

  const MapPin = () => e('svg', {
    className: 'h-6 w-6',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, e('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
  }), e('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'
  }));

  const ChevronRight = () => e('svg', {
    className: 'h-5 w-5',
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24'
  }, e('path', {
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: 2,
    d: 'M9 5l7 7-7 7'
  }));

  // メインコンポーネント
  const ExamDisplay = ({ municipality = '川越市', examType = null, displayMode = 'detail', links = [] }) => {
    const [examData, setExamData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list');

    // 日付フォーマット
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      return new Date(dateString).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // 申し込み状況判定
    const getApplicationStatus = (startDate, endDate) => {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (now < start) return { status: 'upcoming', text: '募集前', color: 'gray' };
      if (now >= start && now <= end) return { status: 'active', text: '募集中', color: 'green' };
      return { status: 'closed', text: '募集終了', color: 'red' };
    };

    // データ取得
    useEffect(() => {
      const fetchExamData = async () => {
        setLoading(true);
        try {
          // APIのURLを構築
          let url = `https://haikakin.com/api/exam-api.php?municipality=${encodeURIComponent(municipality)}`;
          if (examType && displayMode !== 'summary') {
            url += `&exam_type=${encodeURIComponent(examType)}`;
          }
          
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error('データの取得に失敗しました');
          }
          const data = await response.json();
          
          // クライアントサイドでのフィルタリング
          let filteredData = data;
          if (examType && displayMode !== 'summary') {
            filteredData = data.filter(exam => 
              exam.exam_type && exam.exam_type.includes(examType)
            );
          }
          
          // 募集状況による優先ソート
          const sortedData = filteredData.sort((a, b) => {
            const statusA = getApplicationStatus(a.application_start, a.application_end);
            const statusB = getApplicationStatus(b.application_start, b.application_end);
            
            const priority = { active: 3, upcoming: 2, closed: 1 };
            const priorityA = priority[statusA.status] || 0;
            const priorityB = priority[statusB.status] || 0;
            
            if (priorityA !== priorityB) {
              return priorityB - priorityA;
            }
            
            return new Date(a.exam_date) - new Date(b.exam_date);
          });
          
          setExamData(sortedData);
        } catch (error) {
          console.error('データ取得エラー:', error);
          setExamData([]);
        } finally {
          setLoading(false);
        }
      };

      if (municipality) {
        fetchExamData();
      }
    }, [municipality, examType, displayMode]);

    // exam_typeでグループ化（要約表示用）
    const getGroupedData = () => {
      const grouped = {};
      examData.forEach(exam => {
        const examType = exam.exam_type || '未分類';
        if (!grouped[examType]) {
          grouped[examType] = {
            exam_type: examType,
            positions: [],
            total_positions: 0,
            active_count: 0,
            upcoming_count: 0,
            latest_exam_date: null
          };
        }
        
        grouped[examType].positions.push(exam.position);
        grouped[examType].total_positions += exam.recruit_number || 0;
        
        const status = getApplicationStatus(exam.application_start, exam.application_end);
        if (status.status === 'active') grouped[examType].active_count++;
        if (status.status === 'upcoming') grouped[examType].upcoming_count++;
        
        if (!grouped[examType].latest_exam_date || new Date(exam.exam_date) > new Date(grouped[examType].latest_exam_date)) {
          grouped[examType].latest_exam_date = exam.exam_date;
        }
      });
      
      return Object.values(grouped);
    };

    // 統計データ計算
    const getStatistics = () => {
      if (displayMode === 'summary') {
        const groupedData = getGroupedData();
        const totalPositions = groupedData.reduce((sum, group) => sum + group.total_positions, 0);
        return { 
          totalExamTypes: groupedData.length,
          totalPositions,
          avgRatio: null // 要約表示では計算しない
        };
      } else {
        if (!examData.length) return null;
        
        const totalPositions = examData.reduce((sum, exam) => sum + (exam.recruit_number || 0), 0);
        const avgRatio = examData.reduce((sum, exam) => {
          const latestResult = exam.examResults?.[0];
          return sum + (latestResult?.ratio || 0);
        }, 0) / examData.length;
        
        return { totalPositions, avgRatio: avgRatio.toFixed(1) };
      }
    };

    // リンク検索
    const findLinkForExamType = (examType) => {
      const linkData = links.find(link => link.exam_type === examType);
      return linkData ? linkData.url : null;
    };

    if (loading) {
      return e('div', {
        className: 'flex justify-center items-center h-64'
      }, 
        e('div', { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600' }),
        e('span', { className: 'ml-2 text-gray-600' }, '試験情報を読み込み中...')
      );
    }

    const stats = getStatistics();

    // タイトル表示の調整
    const getDisplayTitle = () => {
      let title = `${municipality} 公務員試験情報`;
      if (examType && displayMode !== 'summary') {
        title += ` (${examType})`;
      } else if (displayMode === 'summary') {
        title += ' (要約)';
      }
      return title;
    };

    // 要約表示
    if (displayMode === 'summary') {
      const groupedData = getGroupedData();
      
      return e('div', {
        className: 'max-w-4xl mx-auto p-6 bg-white'
      }, [
        // ヘッダー
        e('div', { className: 'mb-6', key: 'header' }, [
          e('div', { className: 'flex items-center gap-2 mb-2', key: 'title' }, [
            e(MapPin, { key: 'icon' }),
            e('h1', { 
              className: 'text-2xl font-bold text-gray-800',
              key: 'h1'
            }, getDisplayTitle())
          ]),
          
          // 統計サマリー
          stats && e('div', { 
            className: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4',
            key: 'stats'
          }, [
            e('div', { className: 'bg-blue-50 p-3 rounded-lg text-center', key: 'stat1' }, [
              e('div', { className: 'text-2xl font-bold text-blue-600', key: 'count' }, stats.totalExamTypes),
              e('div', { className: 'text-sm text-blue-800', key: 'label' }, '試験区分')
            ]),
            e('div', { className: 'bg-green-50 p-3 rounded-lg text-center', key: 'stat2' }, [
              e('div', { className: 'text-2xl font-bold text-green-600', key: 'total' }, stats.totalPositions),
              e('div', { className: 'text-sm text-green-800', key: 'label' }, '募集人数合計')
            ])
          ])
        ]),

        // 要約カード表示
        groupedData.length > 0 ? e('div', { 
          className: 'space-y-4',
          key: 'summary-list'
        }, groupedData.map((group, index) => {
          const linkUrl = findLinkForExamType(group.exam_type);
          const uniquePositions = [...new Set(group.positions)];
          
          const cardContent = e('div', {
            key: index,
            className: `border border-gray-200 rounded-lg p-6 transition-all duration-200 ${
              linkUrl ? 'hover:shadow-lg hover:border-blue-300 cursor-pointer bg-gradient-to-r from-blue-50 to-white' : 'hover:shadow-md'
            }`
          }, [
            e('div', { className: 'flex justify-between items-center', key: 'content' }, [
              e('div', { className: 'flex-1', key: 'main-info' }, [
                e('h3', { 
                  className: `text-xl font-bold mb-2 ${linkUrl ? 'text-blue-700' : 'text-gray-800'}`,
                  key: 'exam-type'
                }, group.exam_type),
                e('p', { 
                  className: 'text-gray-600 mb-3',
                  key: 'positions'
                }, `${uniquePositions.length}職種: ${uniquePositions.slice(0, 3).join('、')}${uniquePositions.length > 3 ? '...' : ''}`),
                e('div', { className: 'grid grid-cols-3 gap-4 text-sm', key: 'details' }, [
                  e('div', { key: 'recruit' }, [
                    e('div', { className: 'text-gray-500', key: 'label' }, '募集人数'),
                    e('div', { className: 'font-semibold text-blue-600', key: 'value' }, `${group.total_positions}名`)
                  ]),
                  e('div', { key: 'active' }, [
                    e('div', { className: 'text-gray-500', key: 'label' }, '募集中'),
                    e('div', { className: 'font-semibold text-green-600', key: 'value' }, `${group.active_count}件`)
                  ]),
                  e('div', { key: 'exam-date' }, [
                    e('div', { className: 'text-gray-500', key: 'label' }, '直近試験日'),
                    e('div', { className: 'font-semibold text-orange-600', key: 'value' }, formatDate(group.latest_exam_date))
                  ])
                ])
              ]),
              linkUrl && e('div', { className: 'ml-4', key: 'arrow' }, [
                e(ChevronRight, { key: 'icon' })
              ])
            ])
          ]);

          // リンクがある場合はaタグで囲む
          if (linkUrl) {
            return e('a', {
              key: index,
              href: linkUrl,
              className: 'block no-underline'
            }, cardContent);
          }

          return cardContent;
        })) : e('div', {
          className: 'text-center py-8 text-gray-500',
          key: 'no-data'
        }, `${municipality}の試験情報は現在登録されていません。`)
      ]);
    }

    // 通常の詳細表示（既存のコード）
    return e('div', {
      className: 'max-w-4xl mx-auto p-6 bg-white'
    }, [
      // ヘッダー
      e('div', { className: 'mb-6', key: 'header' }, [
        e('div', { className: 'flex items-center gap-2 mb-2', key: 'title' }, [
          e(MapPin, { key: 'icon' }),
          e('h1', { 
            className: 'text-2xl font-bold text-gray-800',
            key: 'h1'
          }, getDisplayTitle())
        ]),
        
        // フィルター情報表示
        examType && e('div', {
          className: 'mb-4 p-3 bg-blue-50 rounded-lg',
          key: 'filter-info'
        }, [
          e('div', { className: 'text-sm text-blue-800', key: 'filter-text' }, 
            `絞り込み条件: ${examType}`)
        ]),
        
        // 統計サマリー
        stats && e('div', { 
          className: 'grid grid-cols-1 md:grid-cols-3 gap-4 mb-4',
          key: 'stats'
        }, [
          e('div', { className: 'bg-blue-50 p-3 rounded-lg text-center', key: 'stat1' }, [
            e('div', { className: 'text-2xl font-bold text-blue-600', key: 'count' }, examData.length),
            e('div', { className: 'text-sm text-blue-800', key: 'label' }, '試験区分')
          ]),
          e('div', { className: 'bg-green-50 p-3 rounded-lg text-center', key: 'stat2' }, [
            e('div', { className: 'text-2xl font-bold text-green-600', key: 'total' }, stats.totalPositions),
            e('div', { className: 'text-sm text-green-800', key: 'label' }, '募集人数合計')
          ]),
          e('div', { className: 'bg-orange-50 p-3 rounded-lg text-center', key: 'stat3' }, [
            e('div', { className: 'text-2xl font-bold text-orange-600', key: 'avg' }, stats.avgRatio),
            e('div', { className: 'text-sm text-orange-800', key: 'label' }, '平均倍率')
          ])
        ]),

        // 表示モード切替
        e('div', { className: 'flex gap-2 mb-4', key: 'mode-toggle' }, [
          e('button', {
            key: 'list-btn',
            onClick: () => setViewMode('list'),
            className: `px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`
          }, '一覧表示'),
          e('button', {
            key: 'detail-btn',
            onClick: () => setViewMode('detail'),
            className: `px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'detail' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`
          }, '詳細表示')
        ])
      ]),

      // 試験情報表示（詳細表示用 - 既存のコードをそのまま使用）
      examData.length > 0 ? e('div', { 
        className: viewMode === 'list' ? 'space-y-4' : 'space-y-6',
        key: 'exam-list'
      }, examData.map((exam) => {
        const applicationStatus = getApplicationStatus(exam.application_start, exam.application_end);
        const latestResult = exam.examResults?.[0];
        
        if (viewMode === 'list') {
          return e('div', {
            key: exam.id,
            className: 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
          }, [
            e('div', { className: 'grid grid-cols-1 md:grid-cols-4 gap-4', key: 'content' }, [
              // 基本情報
              e('div', { key: 'basic' }, [
                e('h3', { className: 'font-semibold text-lg text-gray-800', key: 'type' }, exam.exam_type),
                e('p', { className: 'text-blue-600 font-medium', key: 'position' }, exam.position),
                e('div', { className: 'flex items-center gap-1 mt-1', key: 'status' }, [
                  e('span', {
                    key: 'badge',
                    className: `px-2 py-1 rounded-full text-xs font-medium bg-${applicationStatus.color}-100 text-${applicationStatus.color}-800`
                  }, applicationStatus.text)
                ])
              ]),
              
              // 日程情報
              e('div', { className: 'text-sm text-gray-600', key: 'schedule' }, [
                e('div', { className: 'flex items-center gap-1 mb-1', key: 'exam-date' }, [
                  e(Calendar, { key: 'icon' }),
                  e('span', { key: 'text' }, `試験日: ${formatDate(exam.exam_date)}`)
                ]),
                e('div', { className: 'flex items-center gap-1', key: 'recruit' }, [
                  e(Users, { key: 'icon' }),
                  e('span', { key: 'text' }, `募集: ${exam.recruit_number || '-'}名`)
                ])
              ]),
              
              // 申込期間
              e('div', { className: 'text-sm text-gray-600', key: 'application' }, [
                e('div', { key: 'start' }, `申込: ${formatDate(exam.application_start)}`),
                e('div', { key: 'end' }, `　 ～ ${formatDate(exam.application_end)}`)
              ]),
              
              // 倍率・リンク
              e('div', { className: 'text-right', key: 'actions' }, [
                latestResult && e('div', { 
                  className: 'bg-orange-50 p-2 rounded mb-2',
                  key: 'ratio'
                }, [
                  e('div', { className: 'text-lg font-bold text-orange-600', key: 'value' }, `${latestResult.ratio}倍`),
                  e('div', { className: 'text-xs text-orange-800', key: 'year' }, latestResult.year)
                ]),
                exam.official_url && e('a', {
                  key: 'link',
                  href: exam.official_url,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className: 'inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm'
                }, [
                  e(ExternalLink, { key: 'icon' }),
                  '詳細情報'
                ])
              ])
            ])
          ]);
        } else {
          // 詳細表示（既存のコードと同じ）
          return e('div', {
            key: exam.id,
            className: 'border border-gray-200 rounded-lg p-6'
          }, [
            e('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6', key: 'content' }, [
              // 基本情報
              e('div', { key: 'basic' }, [
                e('h3', { 
                  className: 'text-xl font-bold text-gray-800 mb-4',
                  key: 'title'
                }, `${exam.exam_type} - ${exam.position}`),
                
                e('div', { className: 'space-y-3', key: 'details' }, [
                  e('div', { key: 'age' }, [
                    e('label', { className: 'block text-sm font-medium text-gray-700', key: 'label' }, '年齢要件'),
                    e('p', { className: 'text-gray-600', key: 'value' }, exam.age_requirement)
                  ]),
                  
                  e('div', { className: 'grid grid-cols-2 gap-4', key: 'recruit-status' }, [
                    e('div', { key: 'recruit' }, [
                      e('label', { className: 'block text-sm font-medium text-gray-700', key: 'label' }, '募集人数'),
                      e('p', { className: 'text-lg font-semibold text-blue-600', key: 'value' }, `${exam.recruit_number || '-'}名`)
                    ]),
                    e('div', { key: 'status' }, [
                      e('label', { className: 'block text-sm font-medium text-gray-700', key: 'label' }, '募集状況'),
                      e('span', {
                        key: 'badge',
                        className: `px-3 py-1 rounded-full text-sm font-medium bg-${applicationStatus.color}-100 text-${applicationStatus.color}-800`
                      }, applicationStatus.text)
                    ])
                  ]),
                  
                  e('div', { key: 'application-period' }, [
                    e('label', { className: 'block text-sm font-medium text-gray-700', key: 'label' }, '申込期間'),
                    e('p', { className: 'text-gray-600', key: 'value' }, `${formatDate(exam.application_start)} ～ ${formatDate(exam.application_end)}`)
                  ]),
                  
                  e('div', { key: 'exam-date' }, [
                    e('label', { className: 'block text-sm font-medium text-gray-700', key: 'label' }, '試験日'),
                    e('p', { className: 'text-lg font-semibold text-green-600', key: 'value' }, formatDate(exam.exam_date))
                  ])
                ]),
                
                // 試験内容
                (exam.first_test || exam.second_test || exam.third_test) && e('div', {
                  className: 'mt-6 p-4 bg-blue-50 rounded-lg',
                  key: 'exam-content'
                }, [
                  e('h4', { 
                    className: 'font-semibold text-blue-800 mb-3 flex items-center gap-2',
                    key: 'title'
                  }, [
                    e(FileText, { key: 'icon' }),
                    '試験内容'
                  ]),
                  e('div', { className: 'space-y-2 text-sm', key: 'content' }, [
                    exam.first_test && e('div', { key: 'first' }, [
                      e('span', { className: 'font-medium text-blue-700', key: 'label' }, '第1次試験:'),
                      e('span', { className: 'text-blue-600 ml-2', key: 'value' }, exam.first_test)
                    ]),
                    exam.second_test && e('div', { key: 'second' }, [
                      e('span', { className: 'font-medium text-blue-700', key: 'label' }, '第2次試験:'),
                      e('span', { className: 'text-blue-600 ml-2', key: 'value' }, exam.second_test)
                    ]),
                    exam.third_test && e('div', { key: 'third' }, [
                      e('span', { className: 'font-medium text-blue-700', key: 'label' }, '第3次試験:'),
                      e('span', { className: 'text-blue-600 ml-2', key: 'value' }, exam.third_test)
                    ])
                  ])
                ])
              ]),
              
              // 過去の結果
              e('div', { key: 'results' }, [
                e('h4', { 
                  className: 'text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2',
                  key: 'title'
                }, [
                  e(TrendingUp, { key: 'icon' }),
                  '過去の試験結果'
                ]),
                
                exam.examResults && exam.examResults.length > 0 ? 
                  e('div', { className: 'space-y-3', key: 'results-list' }, 
                    exam.examResults.map((result, index) => 
                      e('div', { 
                        key: index,
                        className: 'bg-gray-50 p-3 rounded-lg'
                      }, [
                        e('div', { className: 'flex justify-between items-center mb-2', key: 'header' }, [
                          e('span', { className: 'font-medium text-gray-800', key: 'year' }, result.year),
                          e('span', { className: 'text-xl font-bold text-orange-600', key: 'ratio' }, `${result.ratio}倍`)
                        ]),
                        e('div', { className: 'grid grid-cols-2 gap-4 text-sm text-gray-600', key: 'details' }, [
                          e('div', { key: 'applicants' }, `受験者数: ${result.applicants}名`),
                          e('div', { key: 'successful' }, `合格者数: ${result.successful}名`)
                        ])
                      ])
                    )
                  ) : 
                  e('p', { className: 'text-gray-500', key: 'no-data' }, '過去のデータはありません'),
                
                e('div', { className: 'mt-4', key: 'official-link' },
                  exam.official_url && e('a', {
                    href: exam.official_url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'
                  }, [
                    e(ExternalLink, { key: 'icon' }),
                    '公式サイトで詳細を確認'
                  ])
                )
              ])
            ])
          ]);
        }
      })) : e('div', {
        className: 'text-center py-8 text-gray-500',
        key: 'no-data'
      }, examType ? 
        `${municipality}の「${examType}」試験情報は現在登録されていません。` :
        `${municipality}の試験情報は現在登録されていません。`)
    ]);
  };

  // 初期化
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('exam-display-root');
    if (container) {
      // URLパラメータから取得
      const urlParams = new URLSearchParams(window.location.search);
      let municipality = urlParams.get('municipality');
      let examType = urlParams.get('exam_type');
      let displayMode = urlParams.get('display_mode');
      let links = [];

      // URLパラメータがない場合はdata属性を使用
      if (!municipality) {
        municipality = container.getAttribute('data-municipality') || '川越市';
      }
      if (!examType) {
        examType = container.getAttribute('data-exam_type');
      }
      if (!displayMode) {
        displayMode = container.getAttribute('data-display-mode') || 'detail';
      }
      
      // data-linksをパース
      const linksData = container.getAttribute('data-links');
      if (linksData) {
        try {
          links = JSON.parse(linksData);
        } catch (error) {
          console.error('data-linksのJSONパースエラー:', error);
          links = [];
        }
      }
      
      ReactDOM.render(e(ExamDisplay, { municipality, examType, displayMode, links }), container);
    }
  });

})();
