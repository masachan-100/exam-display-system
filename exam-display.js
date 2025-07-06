<script src="https://cdn.tailwindcss.com"></script>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<div id="exam-display-root"></div>

<script>
const e = React.createElement;

function SimpleExamList() {
  const [data, setData] = React.useState([]);
  
  React.useEffect(() => {
    fetch('https://haikakin.com/api/exam-api.php?municipality=堺市')
      .then(r => r.json())
      .then(setData);
  }, []);
  
  return e('div', {}, [
    e('h2', {key: 'title'}, '堺市 公務員試験'),
    data.map(exam => 
      e('div', {
        key: exam.id,
        style: {border: '1px solid #ccc', padding: '10px', margin: '10px 0'}
      }, [
        e('h3', {key: 'title'}, exam.exam_title),
        e('p', {key: 'cat'}, exam.job_categories),
        e('p', {key: 'start'}, '申込開始: ' + exam.application_start),
        e('p', {key: 'end'}, '申込終了: ' + exam.application_end)
      ])
    )
  ]);
}

const root = ReactDOM.createRoot(document.getElementById('exam-display-root'));
root.render(e(SimpleExamList));
</script>
