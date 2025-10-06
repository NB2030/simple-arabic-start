const Index = () => {
  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>صفحة بسيطة</h1>
      <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '10px' }}>
        هذه صفحة بسيطة جداً.
      </p>
      <p style={{ fontSize: '14px', color: '#666' }}>
        نص بسيط وبدائي.
      </p>
      <hr style={{ margin: '20px 0', border: '1px solid #ccc' }} />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '5px' }}>• عنصر أول</li>
        <li style={{ marginBottom: '5px' }}>• عنصر ثاني</li>
        <li style={{ marginBottom: '5px' }}>• عنصر ثالث</li>
      </ul>
    </div>
  );
};

export default Index;
