// src/pages/Vacancy.jsx
import React, { useState, useEffect } from 'react';


const Vacancy = () => {
  const [vacancies, setVacancies] = useState([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/job-positions', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setVacancies(data.job_positions || data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading vacancies:', err);
        setLoading(false);
      });
  }, []);

  
  // Primary Vacancies List View
  return (
    <div style={{ padding: '20px' }}>
      <h2>Job Vacancies</h2>

      {loading ? (
        <div>Loading vacancies...</div>
      ) : (
        <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
          {vacancies.map((vacancy) => (
    <div
        key={vacancy.id}
        style={{
            border: '1px solid #ccc',
            padding: '15px',
            borderRadius: '8px',
            backgroundColor: '#fff'
        }}
    >
        <h3>{vacancy.title}</h3>

        <p>
            Department: {vacancy.department || 'General'}
        </p>
    </div>
))}
        </div>
      )}
    </div>
  );
};

export default Vacancy;