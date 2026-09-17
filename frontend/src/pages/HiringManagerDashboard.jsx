import { useEffect, useState } from "react";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8001/api";

function HiringManagerDashboard() {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/applications`,
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to fetch applications."
                );
            }

            const allApplications = Array.isArray(data)
                ? data
                : data.applications || [];

            const sentApplications =
                allApplications.filter(
                    (application) =>
                        application.sent_to_hiring_manager === true ||
                        application.sent_to_hiring_manager === 1
                );

            setApplications(sentApplications);
        } catch (error) {
            console.error(
                "HIRING MANAGER APPLICATION ERROR:",
                error
            );

            setError(
                error.message ||
                "Unable to load candidates."
            );
        } finally {
            setLoading(false);
        }
    };


    const handleSelectCandidate = async (applicationId) => {
    try {
        setError("");

        const response = await fetch(
            `${API_URL}/applications/${applicationId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: "shortlisted",
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to select candidate."
            );
        }

        setApplications((currentApplications) =>
            currentApplications.map((application) =>
                application.id === applicationId
                    ? {
                          ...application,
                          status: "shortlisted",
                      }
                    : application
            )
        );

        alert("Candidate selected successfully.");
    } catch (error) {
        console.error(
            "SELECT CANDIDATE ERROR:",
            error
        );

        setError(
            error.message ||
            "Unable to select candidate."
        );
    }
};

    return (
        <div style={{ padding: "40px" }}>
            <h1>Hiring Manager Dashboard</h1>

            <p>
                Welcome, {user?.name || "Hiring Manager"}
            </p>

            <hr />

            <h2>
                Candidates Sent for Secondary Shortlisting
            </h2>

            {loading && <p>Loading candidates...</p>}

            {error && (
                <p style={{ color: "red" }}>
                    {error}
                </p>
            )}

            {!loading &&
                !error &&
                applications.length === 0 && (
                    <p>
                        No candidates have been sent by HR yet.
                    </p>
                )}

            {!loading &&
                applications.length > 0 && (
                    <div>
                        <p>
                            {applications.length} candidate(s)
                            received from HR.
                        </p>

                        {applications.map((application) => (
                            <div
                                key={application.id}
                                style={{
                                    border: "1px solid #ccc",
                                    padding: "20px",
                                    marginBottom: "15px",
                                    borderRadius: "8px",
                                }}
                            >
                                <h3>
                                    {application.candidate?.user?.name ||
                                        "Unknown Candidate"}
                                </h3>

                                <p>
                                    Email:{" "}
                                    {application.candidate?.user?.email ||
                                        "N/A"}
                                </p>

                                <p>
                                    Match Score:{" "}
                                    {application.match_score}%
                                </p>

                                <p>
                                    Status:{" "}
                                    {application.status}
                                </p>
<button
    type="button"
    onClick={() =>
        setSelectedCandidate(application)
    }
>
    View Candidate
</button>
                                <div>
    <button
        type="button"
        onClick={() => {

            const confirmed = window.confirm(
                `Select ${
                    application.candidate?.user?.name ||
                    "this candidate"
                } for the next stage?`
            );

            if (!confirmed) {
                return;
            }

            handleSelectCandidate(application.id);
        }}
    >
        {application.status === "shortlisted"
            ? "✓ Selected"
            : "Select Candidate"}
    </button>
</div>
                            </div>
                        ))}
                    </div>
                )}
        </div>
    );
}

export default HiringManagerDashboard;