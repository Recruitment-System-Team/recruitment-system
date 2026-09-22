import { useEffect, useMemo, useState } from "react";
import "./HiringManagerDashboard.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8001/api";

function HiringManagerDashboard() {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedVacancyId, setSelectedVacancyId] = useState(null);
const [selectedCandidate, setSelectedCandidate] = useState(null);
const [interviews, setInterviews] = useState([]);
const [selectedInterviewVacancyId, setSelectedInterviewVacancyId] =
    useState(null);
const [selectedInterview, setSelectedInterview] = useState(null);

const [interviewFeedback, setInterviewFeedback] = useState([]);
const [feedbackText, setFeedbackText] = useState("");

const [feedbackLoading, setFeedbackLoading] = useState(false);
const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
const [feedbackError, setFeedbackError] = useState("");
const [openVacancies, setOpenVacancies] = useState({});

/*
 * Candidates selected for the secondary shortlist.
 * These are only selected locally until the
 * Hiring Manager sends them to HR.
 */
const [selectedForShortlist, setSelectedForShortlist] =
    useState([]);
    const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("hiringManagerTheme") !== "light";
});

    /*
     * ---------------------------------------------------------
     * FETCH APPLICATIONS
     * ---------------------------------------------------------
     */

    useEffect(() => {
        fetchApplications();
        fetchInterviews();
    }, []);
    useEffect(() => {
    localStorage.setItem(
        "hiringManagerTheme",
        isDarkMode ? "dark" : "light"
    );
}, [isDarkMode]);

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

            /*
             * Only candidates that HR has sent to the
             * Hiring Manager are displayed.
             */
            const sentApplications =
                allApplications.filter(
                    (application) =>
                        application.sent_to_hiring_manager ===
                            true ||
                        application.sent_to_hiring_manager === 1
                );

            setApplications(sentApplications);

            /*
             * Automatically select the first vacancy.
             */
            if (sentApplications.length > 0) {
                const firstVacancyId =
                    sentApplications[0].job_position_id;

                setSelectedVacancyId(firstVacancyId);

                setOpenVacancies({
                    [firstVacancyId]: true,
                });
            }
        } catch (err) {
            console.error(
                "HIRING MANAGER APPLICATION ERROR:",
                err
            );

            setError(
                err.message ||
                    "Unable to load candidates."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
 * ---------------------------------------------------------
 * FETCH INTERVIEWS
 * ---------------------------------------------------------
 */

const fetchInterviews = async () => {
    try {
        setError("");

        const response = await fetch(
            `${API_URL}/interviews`,
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
                    "Unable to fetch interviews."
            );
        }

        setInterviews(
            Array.isArray(data)
                ? data
                : data.interviews || []
        );
    } catch (err) {
        console.error(
            "HIRING MANAGER INTERVIEWS ERROR:",
            err
        );

        setError(
            err.message ||
                "Unable to load interviews."
        );
    }
};
    /*
     * ---------------------------------------------------------
     * GROUP APPLICATIONS BY VACANCY
     * ---------------------------------------------------------
     */

    const vacancies = useMemo(() => {
    const grouped = {};

    applications.forEach((application) => {
        const vacancyId = application.job_position_id;

        if (!vacancyId) return;

        if (!grouped[vacancyId]) {
            const jobPosition =
                application.job_position ||
                application.jobPosition ||
                {};

            grouped[vacancyId] = {
                id: vacancyId,

                // This is the vacancy title
                title:
                    jobPosition.title ||
                    jobPosition.name ||
                    "Untitled Vacancy",

                // Keep the job position object too
                jobPosition,

                applications: [],
            };
        }

        grouped[vacancyId].applications.push(application);
    });

    return Object.values(grouped);
}, [applications]);

    /*
     * ---------------------------------------------------------
     * CURRENT VACANCY
     * ---------------------------------------------------------
     */

    const selectedVacancy = vacancies.find(
        (vacancy) =>
            vacancy.id === selectedVacancyId
    );

    const selectedVacancyApplications =
        selectedVacancy?.applications || [];

    /*
     * ---------------------------------------------------------
     * SIDEBAR VACANCY TOGGLE
     * ---------------------------------------------------------
     */

    const toggleVacancy = (vacancyId) => {
        setOpenVacancies((current) => ({
            ...current,
            [vacancyId]:
                !current[vacancyId],
        }));
    };

    /*
     * ---------------------------------------------------------
     * OPEN CANDIDATES
     * ---------------------------------------------------------
     */

    const openVacancyCandidates = (vacancy) => {
    setSelectedInterviewVacancyId(null);

    setSelectedVacancyId(vacancy.id);

    setOpenVacancies((current) => ({
        ...current,
        [vacancy.id]: true,
    }));
};

   /*
 * ---------------------------------------------------------
 * SELECT / UNSELECT CANDIDATE
 * ---------------------------------------------------------
 */

const handleSelectCandidate = (applicationId) => {
    setSelectedForShortlist((current) => {
        if (current.includes(applicationId)) {
            return current.filter(
                (id) => id !== applicationId
            );
        }

        return [...current, applicationId];
    });
};

/*
 * ---------------------------------------------------------
 * SEND SECONDARY SHORTLIST TO HR
 * ---------------------------------------------------------
 */

const handleSendShortlistedToHR = async () => {
    if (!selectedVacancyId) {
        alert("Please select a vacancy.");
        return;
    }

    if (selectedForShortlist.length === 0) {
        alert(
            "Please select at least one candidate."
        );
        return;
    }

    const confirmed = window.confirm(
        `Send ${selectedForShortlist.length} selected candidate${
            selectedForShortlist.length > 1
                ? "s"
                : ""
        } back to HR?`
    );

    if (!confirmed) return;

    try {
        setError("");

        const response = await fetch(
            `${API_URL}/applications/send-shortlisted-to-hr`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    job_position_id:
                        selectedVacancyId,
                    application_ids:
                        selectedForShortlist,
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                    "Unable to send shortlisted candidates to HR."
            );
        }

        /*
         * Mark the candidates as shortlisted
         * in the local application state.
         */
        setApplications((current) =>
            current.map((application) =>
                selectedForShortlist.includes(
                    application.id
                )
                    ? {
                          ...application,
                          shortlisted_by_hiring_manager:
                              true,
                      }
                    : application
            )
        );

        setSelectedForShortlist([]);

        alert(
            "Shortlisted candidates have been sent to HR successfully."
        );
    } catch (err) {
        console.error(
            "SEND SHORTLISTED TO HR ERROR:",
            err
        );

        setError(
            err.message ||
                "Unable to send shortlisted candidates to HR."
        );
    }
};

    /*
     * ---------------------------------------------------------
     * HELPERS
     * ---------------------------------------------------------
     */

    const getCandidateName = (application) => {
        return (
            application?.candidate?.user?.name ||
            application?.candidate?.name ||
            "Unknown Candidate"
        );
    };


    /*
 * ---------------------------------------------------------
 * VIEW CV
 * ---------------------------------------------------------
 */

const handleViewCv = async (cvId) => {
    if (!cvId) {
        alert("No CV is available for this candidate.");
        return;
    }

    try {
        setError("");

        const response = await fetch(
            `${API_URL}/cvs/${cvId}/view`,
            {
                method: "GET",
                headers: {
                    Accept: "application/pdf",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            let message =
                "Unable to open the CV.";

            try {
                const data =
                    await response.json();

                message =
                    data.message || message;
            } catch {
                // Response was not JSON.
            }

            throw new Error(message);
        }

        const blob = await response.blob();

        const blobUrl =
            window.URL.createObjectURL(blob);

        window.open(blobUrl, "_blank");

        /*
         * Give the new tab time to load before
         * releasing the temporary object URL.
         */
        setTimeout(() => {
            window.URL.revokeObjectURL(
                blobUrl
            );
        }, 10000);
    } catch (err) {
        console.error(
            "HIRING MANAGER CV VIEW ERROR:",
            err
        );

        setError(
            err.message ||
                "Unable to open the CV."
        );
    }
};

    const getCandidateEmail = (application) => {
        return (
            application?.candidate?.user?.email ||
            application?.candidate?.email ||
            "No email available"
        );
    };

    const getJobTitle = (vacancy) => {
    return vacancy?.title || "Untitled Vacancy";
};

/*
 * ---------------------------------------------------------
 * INTERVIEW HELPERS
 * ---------------------------------------------------------
 */

const getInterviewCandidateName = (interview) => {
    return (
        interview?.application?.candidate?.user?.name ||
        interview?.application?.candidate?.name ||
        "Unknown Candidate"
    );
};

const getInterviewNumber = (interview) => {
    return Number(
        interview?.interview_number || 1
    );
};

const getInterviewDate = (interview) => {
    if (!interview?.scheduled_date) {
        return "Date not available";
    }

    return new Date(
        interview.scheduled_date
    ).toLocaleDateString();
};

const getInterviewVacancyId = (interview) => {
    return (
        interview?.application?.job_position_id ||
        interview?.application?.jobPosition?.id ||
        null
    );
};

const getInterviewVacancyTitle = (interview) => {
    return (
        interview?.application?.job_position?.title ||
        interview?.application?.jobPosition?.title ||
        "Untitled Vacancy"
    );
};


/*
 * ---------------------------------------------------------
 * OPEN INTERVIEW FEEDBACK
 * ---------------------------------------------------------
 */

const openInterviewFeedback = async (interview) => {
    setSelectedInterview(interview);

    setInterviewFeedback([]);
    setFeedbackText("");
    setFeedbackError("");

    try {
        setFeedbackLoading(true);

        const response = await fetch(
            `${API_URL}/interviews/${interview.id}/feedback/all`,
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
                    "Unable to load interview feedback."
            );
        }

        const feedback =
            data.feedback || [];

        setInterviewFeedback(feedback);

        /*
         * Find the Hiring Manager's own
         * feedback.
         */
        const ownFeedback =
            feedback.find(
                (item) =>
                    Number(item.interviewer_id) ===
                    Number(user?.id)
            );

        setFeedbackText(
            ownFeedback?.feedback || ""
        );
    } catch (err) {
        console.error(
            "INTERVIEW FEEDBACK LOAD ERROR:",
            err
        );

        setFeedbackError(
            err.message ||
                "Unable to load interview feedback."
        );
    } finally {
        setFeedbackLoading(false);
    }
};


/*
 * ---------------------------------------------------------
 * SUBMIT / UPDATE HIRING MANAGER FEEDBACK
 * ---------------------------------------------------------
 */
const handleSubmitInterviewFeedback = async () => {
    if (!selectedInterview) {
        return;
    }

    if (!feedbackText.trim()) {
        setFeedbackError(
            "Please enter your interview feedback."
        );
        return;
    }

    const ownFeedback = interviewFeedback.find(
        (item) =>
            Number(item.interviewer_id) ===
            Number(user?.id)
    );

    const hasOwnFeedback = Boolean(ownFeedback);

    try {
        setFeedbackSubmitting(true);
        setFeedbackError("");

        const response = await fetch(
            `${API_URL}/interviews/${selectedInterview.id}/feedback`,
            {
                method: hasOwnFeedback
                    ? "PATCH"
                    : "POST",

                headers: {
                    "Content-Type":
                        "application/json",
                    Accept:
                        "application/json",
                    Authorization:
                        `Bearer ${token}`,
                },

                body: JSON.stringify({
                    feedback:
                        feedbackText.trim(),
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                    "Unable to save feedback."
            );
        }

        await openInterviewFeedback(
            selectedInterview
        );
    } catch (err) {
        console.error(
            "HIRING MANAGER FEEDBACK ERROR:",
            err
        );

        setFeedbackError(
            err.message ||
                "Unable to save feedback."
        );
    } finally {
        setFeedbackSubmitting(false);
    }
};

    const getScore = (application) => {
        const score = Number(
            application?.match_score
        );

        if (Number.isNaN(score)) {
            return null;
        }

        return score;
    };

    const getInitials = (name) => {
        if (!name) return "?";

        const parts = name
            .trim()
            .split(" ")
            .filter(Boolean);

        if (parts.length === 1) {
            return parts[0]
                .substring(0, 2)
                .toUpperCase();
        }

        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    };

    const formatStatus = (status) => {
        if (!status) return "New";

        return status
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };


    /*
 * ---------------------------------------------------------
 * INTERVIEW VACANCIES
 * ---------------------------------------------------------
 */

const interviewVacancies = useMemo(() => {
    const grouped = {};

    interviews.forEach((interview) => {
        const vacancyId =
            getInterviewVacancyId(interview);

        if (!vacancyId) return;

        if (!grouped[vacancyId]) {
            grouped[vacancyId] = {
                id: vacancyId,
                title:
                    getInterviewVacancyTitle(
                        interview
                    ),
                interviews: [],
            };
        }

        grouped[vacancyId].interviews.push(
            interview
        );
    });

    return Object.values(grouped);
}, [interviews]);

    /*
     * ---------------------------------------------------------
     * LOADING
     * ---------------------------------------------------------
     */

    if (loading) {
        return (
    <div
        className={`hiring-manager-dashboard ${
            isDarkMode ? "dark-mode" : "light-mode"
        }`}
    >
                <aside className="hiring-sidebar">
                    <div className="hiring-brand">
                        <div className="hiring-brand-logo">
                            HR
                        </div>

                        <div>
                            <div className="hiring-brand-name">
                                Recruitment
                            </div>

                            <div className="hiring-brand-subtitle">
                                Hiring Manager
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="hiring-main">
                    <div className="hiring-loading-screen">
                        <div className="hiring-loading-spinner"></div>

                        <p>
                            Loading hiring
                            dashboard...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    /*
     * ---------------------------------------------------------
     * MAIN UI
     * ---------------------------------------------------------
     */

    return (
        <div
    className={`hiring-manager-dashboard ${
        isDarkMode ? "dark-mode" : "light-mode"
    }`}
>

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="hiring-sidebar">

                {/* BRAND */}

                <div className="hiring-brand">
                    <div className="hiring-brand-logo">
                        HR
                    </div>

                    <div className="hiring-brand-text">
                        <div className="hiring-brand-name">
                            Recruitment
                        </div>

                        <div className="hiring-brand-subtitle">
                            Hiring Manager
                        </div>
                    </div>
                </div>

                {/* NAVIGATION */}

                <div className="hiring-sidebar-navigation">

                    {/* JOB POSTINGS */}

                    <div className="hiring-menu-section">

                        <div className="hiring-menu-title">
                            JOB POSTINGS
                        </div>

                        {vacancies.length === 0 ? (
                            <div className="hiring-no-vacancies">
                                No vacancies
                            </div>
                        ) : (
                            <div className="hiring-vacancy-list">

                                {vacancies.map(
                                    (vacancy) => {
                                        const isOpen =
                                            openVacancies[
                                                vacancy.id
                                            ];

                                        const isActive =
                                            selectedVacancyId ===
                                            vacancy.id;

                                        return (
                                            <div
                                                className="hiring-vacancy-group"
                                                key={
                                                    vacancy.id
                                                }
                                            >

                                                <button
                                                    type="button"
                                                    className={`hiring-navigation-item ${
                                                        isActive
                                                            ? "active"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        toggleVacancy(
                                                            vacancy.id
                                                        )
                                                    }
                                                >

                                                    <span className="hiring-navigation-icon">
                                                        <span className="hiring-folder-icon">
                                                            ▱
                                                        </span>
                                                    </span>

                                                    <span className="hiring-navigation-text">
                                                        {getJobTitle(
                                                            vacancy
                                                        )}
                                                    </span>

                                                    <span
                                                        className={`hiring-navigation-arrow ${
                                                            isOpen
                                                                ? "open"
                                                                : ""
                                                        }`}
                                                    >
                                                        ›
                                                    </span>
                                                </button>

                                                {isOpen && (
                                                    <div className="hiring-vacancy-submenu">

                                                        <button
                                                            type="button"
                                                            className={`hiring-candidates-subitem ${
                                                                isActive
                                                                    ? "active"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                openVacancyCandidates(
                                                                    vacancy
                                                                )
                                                            }
                                                        >
                                                            <span>
                                                                Candidates
                                                            </span>

                                                            <span className="hiring-candidate-count">
                                                                {
                                                                    vacancy
                                                                        .applications
                                                                        .length
                                                                }
                                                            </span>
                                                        </button>

                                                    </div>
                                                )}

                                            </div>
                                        );
                                    }
                                )}

                            </div>
                        )}

                    </div>

                    {/* INTERVIEW */}
{/* INTERVIEW */}

<div className="hiring-menu-section hiring-interview-section">

    <div className="hiring-menu-title">
        INTERVIEW
    </div>

    {interviewVacancies.length === 0 ? (
        <div className="hiring-no-vacancies">
            No interviews
        </div>
    ) : (
        <div className="hiring-vacancy-list">

            {interviewVacancies.map(
                (vacancy) => {

                    const isOpen =
                        selectedInterviewVacancyId ===
                        vacancy.id;

                    return (
                        <div
                            className="hiring-vacancy-group"
                            key={vacancy.id}
                        >

                            <button
                                type="button"
                                className={`hiring-navigation-item ${
                                    isOpen
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() => {
                                    setSelectedVacancyId(
                                        null
                                    );

                                    setSelectedInterviewVacancyId(
                                        isOpen
                                            ? null
                                            : vacancy.id
                                    );
                                }}
                            >

                                <span className="hiring-navigation-icon">
                                    ◷
                                </span>

                                <span className="hiring-navigation-text">
                                    {
                                        vacancy.title
                                    }
                                </span>

                                <span
                                    className={`hiring-navigation-arrow ${
                                        isOpen
                                            ? "open"
                                            : ""
                                    }`}
                                >
                                    ›
                                </span>

                            </button>

                            {isOpen && (
                                <div className="hiring-vacancy-submenu">

                                    <button
                                        type="button"
                                        className="hiring-candidates-subitem active"
                                        onClick={() => {
                                            setSelectedVacancyId(
                                                null
                                            );

                                            setSelectedInterviewVacancyId(
                                                vacancy.id
                                            );
                                        }}
                                    >
                                        <span>
                                            Interviews
                                        </span>

                                        <span className="hiring-candidate-count">
                                            {
                                                vacancy
                                                    .interviews
                                                    .length
                                            }
                                        </span>
                                    </button>

                                </div>
                            )}

                        </div>
                    );
                }
            )}

        </div>
    )}

</div>
                </div>

                {/* SIDEBAR FOOTER */}

                <div className="hiring-sidebar-footer">

                    <div className="hiring-user-card">

                        <div className="hiring-user-avatar">
                            {getInitials(
                                user?.name ||
                                    "Hiring Manager"
                            )}
                        </div>

                        <div className="hiring-user-info">
                            <div className="hiring-user-name">
                                {user?.name ||
                                    "Hiring Manager"}
                            </div>

                            <div className="hiring-user-role">
                                Hiring Manager
                            </div>
                        </div>

                    </div>

                </div>

            </aside>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="hiring-main">

                {/* TOP BAR */}

                <header className="hiring-topbar">

                    <div className="hiring-topbar-left">
                        <span className="hiring-topbar-label">
                            Hiring Management
                        </span>
                    </div>

                    <div className="hiring-topbar-right">

    <button
        type="button"
        className="hiring-theme-toggle"
        onClick={() => setIsDarkMode((current) => !current)}
        aria-label={
            isDarkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
        }
    >
        <span className="hiring-theme-icon">
            {isDarkMode ? "☀" : "☾"}
        </span>

        <span className="hiring-theme-label">
            {isDarkMode ? "Light Mode" : "Dark Mode"}
        </span>
    </button>

    <div className="hiring-topbar-user">
        <div className="hiring-topbar-avatar">
            {getInitials(
                user?.name ||
                    "Hiring Manager"
            )}
        </div>

        <span>
            {user?.name ||
                "Hiring Manager"}
        </span>
    </div>

</div>
                </header>

                {/* CONTENT */}

                <div className="hiring-content">

                    {/* PAGE HEADER */}

                    <div className="hiring-page-header">

                        <div>
                            <div className="hiring-eyebrow">
                                SECONDARY SHORTLISTING
                            </div>

                            <h1>
                                {selectedVacancy
                                    ? getJobTitle(
                                          selectedVacancy
                                      )
                                    : "Hiring Manager Dashboard"}
                            </h1>

                            <p>
                                Review candidates
                                forwarded by HR and
                                select candidates
                                for the interview
                                stage.
                            </p>
                        </div>

                    </div>

                    {/* ERROR */}

                    {error && (
                        <div className="hiring-error">
                            <span>
                                {error}
                            </span>

                            <button
                                type="button"
                                onClick={
                                    fetchApplications
                                }
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* =================================================
                        EMPTY STATE
                    ================================================= */}

                    {selectedInterviewVacancyId ? (
    <>
        {/* INTERVIEW CONTENT */}

        {(() => {
            const currentInterviewVacancy =
                interviewVacancies.find(
                    (vacancy) =>
                        vacancy.id ===
                        selectedInterviewVacancyId
                );

            return (
                <>
                    <div className="hiring-page-header">

                        <div>
                            <div className="hiring-eyebrow">
                                INTERVIEW STAGE
                            </div>

                            <h1>
                                {currentInterviewVacancy?.title ||
                                    "Interviews"}
                            </h1>

                            <p>
                                View interview
                                candidates and
                                review all submitted
                                interview feedback.
                            </p>
                        </div>

                    </div>

                    <section className="hiring-content-card">

                        <div className="hiring-section-header">

                            <div>
                                <h2>
                                    Interviews
                                </h2>

                                <p>
                                    {
                                        currentInterviewVacancy
                                            ?.interviews
                                            ?.length || 0
                                    }{" "}
                                    interview
                                    candidate(s)
                                </p>
                            </div>

                        </div>

                        <div className="hiring-candidate-list">

                            {currentInterviewVacancy?.interviews?.map(
                                (interview) => (
                                    <article
                                        className="hiring-candidate-card"
                                        key={interview.id}
                                    >

                                        <div className="hiring-candidate-avatar">
                                            {getInitials(
                                                getInterviewCandidateName(
                                                    interview
                                                )
                                            )}
                                        </div>

                                        <div className="hiring-candidate-body">

                                            <div className="hiring-candidate-header">

                                                <div>
                                                    <h3 className="hiring-candidate-name">
                                                        {
                                                            getInterviewCandidateName(
                                                                interview
                                                            )
                                                        }
                                                    </h3>

                                                    <p className="hiring-candidate-email">
                                                        Interview{" "}
                                                        {
                                                            getInterviewNumber(
                                                                interview
                                                            )
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            getInterviewDate(
                                                                interview
                                                            )
                                                        }
                                                    </p>
                                                </div>

                                            </div>

                                           <div className="hiring-candidate-actions">

    <button
    type="button"
    className="hiring-secondary-button"
    onClick={() => {
        const application =
            interview.application;

        if (application) {
            setSelectedCandidate(application);

            setSelectedInterview(interview);

            openInterviewFeedback(interview);
        }
    }}
>
    View Profile
</button>
</div>
                                        </div>

                                    </article>
                                )
                            )}

                        </div>

                    </section>
                </>
            );
        })()}
    </>
) : selectedVacancy ? (
                        <>
                            {/* SUMMARY */}

                            <div className="hiring-summary">

                                <div className="hiring-summary-card">
                                    <div className="hiring-summary-icon">
                                        C
                                    </div>

                                    <div>
                                        <span>
                                            Candidates
                                        </span>

                                        <strong>
                                            {
                                                selectedVacancyApplications.length
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="hiring-summary-card">
                                    <div className="hiring-summary-icon">
                                        ✓
                                    </div>

                                    <div>
                                        <span>
                                            Selected
                                        </span>

                                        <strong>
    {
        selectedForShortlist.length
    }
</strong>
                                    </div>
                                </div>

                                <div className="hiring-summary-card">
                                    <div className="hiring-summary-icon">
                                        %
                                    </div>

                                    <div>
                                        <span>
                                            Vacancy
                                        </span>

                                        <strong>
                                            {getJobTitle(
                                                selectedVacancy
                                            )}
                                        </strong>
                                    </div>
                                </div>

                            </div>

                            {/* CANDIDATES CARD */}

                            <section className="hiring-content-card">

                                <div className="hiring-section-header">

                                    <div>
                                        <h2>
                                            Candidates
                                        </h2>

                                        <p>
                                            Candidates
                                            forwarded by
                                            HR for
                                            secondary
                                            shortlisting
                                        </p>
                                    </div>

                                    <div className="hiring-section-actions">

    <div className="hiring-section-count">
        {
            selectedVacancyApplications.length
        }{" "}
        candidates
    </div>

    <button
        type="button"
        className="hiring-primary-button"
        onClick={handleSendShortlistedToHR}
        disabled={
            selectedForShortlist.length === 0
        }
    >
        Send Shortlisted Candidates to HR
        {selectedForShortlist.length > 0 &&
            ` (${selectedForShortlist.length})`}

    </button>

</div>

                                </div>

                                <div className="hiring-candidate-list">

                                    {selectedVacancyApplications.length ===
                                    0 ? (
                                        <div className="hiring-empty-list">
                                            No candidates
                                            have been sent
                                            for this
                                            vacancy yet.
                                        </div>
                                    ) : (
                                        selectedVacancyApplications.map(
                                            (
                                                application
                                            ) => {
                                                const candidateName =
                                                    getCandidateName(
                                                        application
                                                    );

                                                const score =
                                                    getScore(
                                                        application
                                                    );

                                                const isSelected =
    selectedForShortlist.includes(
        application.id
    );

const alreadySentToHR =
    application.shortlisted_by_hiring_manager ===
        true ||
    application.shortlisted_by_hiring_manager ===
        1;

                                                return (
                                                    <article
                                                        className="hiring-candidate-card"
                                                        key={
                                                            application.id
                                                        }
                                                    >

                                                        {/* AVATAR */}

                                                        <div className="hiring-candidate-avatar">
                                                            {getInitials(
                                                                candidateName
                                                            )}
                                                        </div>

                                                        {/* BODY */}

                                                        <div className="hiring-candidate-body">

                                                            <div className="hiring-candidate-header">

                                                                <div>
                                                                    <h3 className="hiring-candidate-name">
                                                                        {
                                                                            candidateName
                                                                        }
                                                                    </h3>

                                                                    <p className="hiring-candidate-email">
                                                                        {getCandidateEmail(
                                                                            application
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <span
    className={`hiring-candidate-status ${
        isSelected || alreadySentToHR
            ? "selected"
            : ""
    }`}
>
    {alreadySentToHR
        ? "Sent to HR"
        : isSelected
        ? "Selected"
        : formatStatus(
              application.status
          )}
</span>

                                                            </div>

                                                            <div className="hiring-candidate-data">

                                                                <div className="hiring-data-box">
                                                                    <span>
                                                                        Match
                                                                        Score
                                                                    </span>

                                                                    <strong className="hiring-score">
                                                                        {score !==
                                                                        null
                                                                            ? `${score.toFixed(
                                                                                  1
                                                                              )}%`
                                                                            : "N/A"}
                                                                    </strong>
                                                                </div>

                                                                <div className="hiring-data-box">
                                                                    <span>
                                                                        Application
                                                                    </span>

                                                                    <strong>
                                                                        #
                                                                        {
                                                                            application.id
                                                                        }
                                                                    </strong>
                                                                </div>

                                                                <div className="hiring-data-box">
                                                                    <span>
                                                                        Status
                                                                    </span>

                                                                    <strong>
                                                                        {formatStatus(
                                                                            application.status
                                                                        )}
                                                                    </strong>
                                                                </div>

                                                            </div>

                                                           <div className="hiring-candidate-actions">

    <button
        type="button"
        className="hiring-secondary-button"
        onClick={() =>
            setSelectedCandidate(
                application
            )
        }
    >
        View Profile
    </button>

    {!alreadySentToHR && (
        <button
            type="button"
            className="hiring-primary-button"
            onClick={() =>
                handleSelectCandidate(
                    application.id
                )
            }
        >
            {isSelected
                ? "Remove Selection"
                : "Select Candidate"}
        </button>
    )}

    {alreadySentToHR && (
        <span className="hiring-selected-label">
            ✓ Sent to HR
        </span>
    )}

</div>

                                                        </div>

                                                    </article>
                                                );
                                            }
                                        )
                                    )}

                                </div>

                            </section>
                        </>
                                        ) : (
                        <div className="hiring-empty-state">
                            <div className="hiring-empty-state-icon">
                                ⌂
                            </div>

                            <h2>
                                Select a vacancy
                            </h2>

                            <p>
                                Select a vacancy from the
                                sidebar to view its candidates.
                            </p>
                        </div>
                    )}

                </div>

            </main>

            {/* =================================================
                CANDIDATE PROFILE MODAL
            ================================================= */}

            {selectedCandidate && (
                <div
                    className="hiring-modal-overlay"
                    onClick={(event) => {
                        if (
    event.target ===
    event.currentTarget
) {
    setSelectedCandidate(null);
    setSelectedInterview(null);
    setInterviewFeedback([]);
    setFeedbackText("");
    setFeedbackError("");
}
                    }}
                >

                    <div className="hiring-modal">

                        <button
    type="button"
    className="hiring-modal-close"
    onClick={() => {
        setSelectedCandidate(null);
        setSelectedInterview(null);
        setInterviewFeedback([]);
        setFeedbackText("");
        setFeedbackError("");
    }}
>
    ×
</button>

                        <div className="hiring-modal-header">

                            <div className="hiring-modal-avatar">
                                {getInitials(
                                    getCandidateName(
                                        selectedCandidate
                                    )
                                )}
                            </div>

                            <div>
                                <span className="hiring-modal-eyebrow">
                                    CANDIDATE PROFILE
                                </span>

                                <h2>
                                    {getCandidateName(
                                        selectedCandidate
                                    )}
                                </h2>

                                <p>
                                    {getCandidateEmail(
                                        selectedCandidate
                                    )}
                                </p>
                            </div>

                        </div>

                        <div className="hiring-profile-details">

                            <div className="hiring-profile-detail">
                                <span>
                                    Vacancy
                                </span>

                                <strong>
                                    {getJobTitle(
                                        selectedVacancy
                                    )}
                                </strong>
                            </div>

                            <div className="hiring-profile-detail">
                                <span>
                                    Match Score
                                </span>

                                <strong>
                                    {getScore(
                                        selectedCandidate
                                    ) !== null
                                        ? `${getScore(
                                              selectedCandidate
                                          ).toFixed(
                                              1
                                          )}%`
                                        : "N/A"}
                                </strong>
                            </div>

                            <div className="hiring-profile-detail">
                                <span>
                                    Application ID
                                </span>

                                <strong>
                                    #
                                    {
                                        selectedCandidate.id
                                    }
                                </strong>
                            </div>

                            <div className="hiring-profile-detail">
                                <span>
                                    Current Status
                                </span>

                                <strong>
                                    {formatStatus(
                                        selectedCandidate.status
                                    )}
                                </strong>
                            </div>

                            {selectedCandidate.cv && (
    <>
        <div className="hiring-profile-detail">
            <span>
                CV
            </span>

            <strong>
                {
                    selectedCandidate
                        .cv
                        .file_name
                }
            </strong>
        </div>

        <div className="hiring-profile-detail">
            <span>
                CV Type
            </span>

            <strong>
                {
                    selectedCandidate
                        .cv
                        .file_type
                }
            </strong>
        </div>

        <div className="hiring-profile-detail">
            <span>
                CV Document
            </span>

            <button
                type="button"
                className="hiring-primary-button"
                onClick={() =>
                    handleViewCv(
                        selectedCandidate.cv.id
                    )
                }
            >
                View CV
            </button>
        </div>
    </>
)}

                        </div>


{/* =================================================
    INTERVIEW FEEDBACK
================================================= */}

{selectedInterview && (
    <div className="hiring-profile-feedback">

        <div className="hiring-profile-feedback-header">
            <div>
                <span className="hiring-modal-eyebrow">
                    INTERVIEW FEEDBACK
                </span>

                <h3>
                    Interview{" "}
                    {getInterviewNumber(
                        selectedInterview
                    )}
                </h3>

                <p>
                    {getInterviewDate(
                        selectedInterview
                    )}
                </p>
            </div>
        </div>

        {feedbackLoading ? (
            <div className="feedback-loading">
                Loading feedback...
            </div>
        ) : (
            <>
                <div className="hiring-feedback-list">

                    {interviewFeedback.length === 0 ? (
                        <div className="hiring-empty-list">
                            No feedback has been
                            submitted yet.
                        </div>
                    ) : (
                        interviewFeedback.map(
                            (feedback) => {

                                const isOwnFeedback =
                                    Number(
                                        feedback.interviewer_id
                                    ) ===
                                    Number(user?.id);

                                return (
                                    <div
                                        className="hiring-feedback-item"
                                        key={
                                            feedback.id
                                        }
                                    >

                                        <div className="hiring-feedback-header">

                                            <strong>
                                                {feedback
                                                    ?.interviewer
                                                    ?.name ||
                                                    "Staff Member"}
                                            </strong>

                                            <span>
                                                {isOwnFeedback
                                                    ? "Your Feedback"
                                                    : "Submitted Feedback"}
                                            </span>

                                        </div>

                                        <p>
                                            {
                                                feedback.feedback
                                            }
                                        </p>

                                        {feedback.created_at && (
                                            <small>
                                                Submitted{" "}
                                                {new Date(
                                                    feedback.created_at
                                                ).toLocaleDateString()}
                                            </small>
                                        )}

                                    </div>
                                );
                            }
                        )
                    )}

                </div>

                {/* HIRING MANAGER OWN FEEDBACK */}

                <div className="hiring-own-feedback">

                    <label>
                        Your Interview Feedback
                    </label>

                    <p className="feedback-help">
                        Add or update your own
                        interview assessment.
                        Feedback submitted by
                        other staff members is
                        view-only.
                    </p>

                    <textarea
                        rows="7"
                        value={feedbackText}
                        onChange={(event) =>
                            setFeedbackText(
                                event.target.value
                            )
                        }
                        placeholder="Enter your interview assessment..."
                    />

                    {feedbackError && (
                        <div className="feedback-error">
                            {feedbackError}
                        </div>
                    )}

                    <button
                        type="button"
                        className="hiring-primary-button"
                        disabled={
                            feedbackSubmitting
                        }
                        onClick={
                            handleSubmitInterviewFeedback
                        }
                    >
                        {feedbackSubmitting
                            ? "Saving..."
                            : interviewFeedback.some(
                                  (feedback) =>
                                      Number(
                                          feedback.interviewer_id
                                      ) ===
                                      Number(user?.id)
                              )
                            ? "Update My Feedback"
                            : "Add My Feedback"}
                    </button>

                </div>
            </>
        )}

    </div>
)}

                        <div className="hiring-modal-actions">

                            <button
    type="button"
    className="hiring-secondary-button"
    onClick={() => {
        setSelectedCandidate(null);
        setSelectedInterview(null);
        setInterviewFeedback([]);
        setFeedbackText("");
        setFeedbackError("");
    }}
>
    Close
</button>

                            {selectedCandidate &&
    !(
        selectedCandidate
            .shortlisted_by_hiring_manager ===
            true ||
        selectedCandidate
            .shortlisted_by_hiring_manager ===
            1
    ) && (
        <button
            type="button"
            className="hiring-primary-button"
            onClick={() =>
                handleSelectCandidate(
                    selectedCandidate.id
                )
            }
        >
            {selectedForShortlist.includes(
                selectedCandidate.id
            )
                ? "Remove Selection"
                : "Select Candidate"}
        </button>
    )}

                        </div>

                    </div>

                </div>
            )}


        </div>
    );


    
}

export default HiringManagerDashboard;