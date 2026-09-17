// src/pages/CandidateProfilePopup.jsx
import React, { useState, useEffect } from 'react';

const CandidateProfilePopup = ({ jobId, onBack }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    fetch(`/api/job-positions/${jobId}/shortlisted`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json'
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setCandidates(data.shortlisted_candidates || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching shortlisted candidates:', err);
        setLoading(false);
      });
  }, [jobId]);

  if (loading) return <div>Loading shortlisted candidates...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <button
      onClick={onBack}
      style={{ marginBottom: '15px', cursor: 'pointer', padding: '6px 12px' }}
      >
        &larr; Back to Vacancies
      </button>

      <h2>Top 5 Shortlisted Candidates</h2>

      {candidates.length === 0 ? (
        <p>No candidates qualified with a score of 60% or higher.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {candidates.map((candidate) => (
            <li
              key={candidate.application_id}
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '12px',
                borderBottom: '1px solid #eee'
              }}
            >
              <div>
                <strong>{candidate.candidate_name}</strong> — Score: {candidate.match_score}% ({candidate.category})
              </div>

              <button
                onClick={() => setSelectedCandidate(candidate)}
                style={{ cursor: 'pointer', background: 'transparent', border: 'none', fontSize: '18px' }}
                title="Edit candidate profile"
              >
                ✏️ Edit
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Candidate Profile Pop-up Modal */}
      {selectedCandidate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '400px' }}>
            <h3>Candidate Profile: {selectedCandidate.candidate_name}</h3>
            <p><strong>Email:</strong> {selectedCandidate.email}</p>
            <p><strong>Match Score:</strong> {selectedCandidate.match_score}%</p>
            <p><strong>Category:</strong> {selectedCandidate.category}</p>
            <p><strong>Status:</strong> {selectedCandidate.status}</p>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedCandidate(null)}
                style={{ padding: '6px 12px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateProfilePopup;