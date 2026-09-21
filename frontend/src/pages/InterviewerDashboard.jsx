import { useEffect, useState } from "react";
import "./InterviewerDashboard.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api";

function InterviewerDashboard() {
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    const token =
        localStorage.getItem("token");

    const [interviews, setInterviews] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [selectedInterview, setSelectedInterview] =
        useState(null);

    const [feedbackText, setFeedbackText] =
        useState("");

    const [existingFeedback, setExistingFeedback] =
        useState(null);

    const [feedbackLoading, setFeedbackLoading] =
        useState(false);

    const [feedbackSubmitting, setFeedbackSubmitting] =
        useState(false);

    const [feedbackError, setFeedbackError] =
        useState("");

    const fetchMyInterviews = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/interviews/my`,
                {
                    headers: {
                        Accept:
                            "application/json",

                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to load interviews."
                );
            }

            setInterviews(
                data.interviews || []
            );
        } catch (error) {
            console.error(
                "MY INTERVIEWS ERROR:",
                error
            );

            setError(
                error.message ||
                    "Unable to load interviews."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyInterviews();
    }, []);

    const getCandidateName = (
        interview
    ) => {
        return (
            interview?.application
                ?.candidate
                ?.user
                ?.name ||
            interview?.application
                ?.candidate
                ?.name ||
            "Candidate"
        );
    };

    const getInterviewDate = (
        interview
    ) => {
        if (!interview?.scheduled_date) {
            return "Date not available";
        }

        return new Date(
            interview.scheduled_date
        ).toLocaleDateString();
    };

    const getInterviewNumber = (
        interview
    ) => {
        return Number(
            interview?.interview_number ||
                1
        );
    };

    const handleViewCv = async (
        interview
    ) => {
        try {
            const cv =
                interview?.application?.cv;

            if (!cv?.id) {
                alert(
                    "CV is not available."
                );
                return;
            }

            const response =
                await fetch(
                    `${API_URL}/cvs/${cv.id}/view`,
                    {
                        headers: {
                            Accept:
                                "application/pdf",

                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Unable to open the CV."
                );
            }

            const blob =
                await response.blob();

            const blobUrl =
                window.URL.createObjectURL(
                    blob
                );

            window.open(
                blobUrl,
                "_blank"
            );

            setTimeout(() => {
                window.URL.revokeObjectURL(
                    blobUrl
                );
            }, 60000);
        } catch (error) {
            console.error(
                "VIEW CV ERROR:",
                error
            );

            alert(
                error.message ||
                    "Unable to open the CV."
            );
        }
    };

    const openFeedback = async (
        interview
    ) => {
        setSelectedInterview(
            interview
        );

        setFeedbackText("");
        setExistingFeedback(null);
        setFeedbackError("");

        try {
            setFeedbackLoading(true);

            const response =
                await fetch(
                    `${API_URL}/interviews/${interview.id}/feedback`,
                    {
                        headers: {
                            Accept:
                                "application/json",

                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to load feedback."
                );
            }

            const savedFeedback =
                data.feedback || null;

            setExistingFeedback(
                savedFeedback
            );

            setFeedbackText(
                savedFeedback?.feedback ||
                    ""
            );
        } catch (error) {
            console.error(
                "FEEDBACK LOAD ERROR:",
                error
            );

            setFeedbackError(
                error.message ||
                    "Unable to load feedback."
            );
        } finally {
            setFeedbackLoading(false);
        }
    };

    const closeFeedback = () => {
        setSelectedInterview(null);
        setFeedbackText("");
        setExistingFeedback(null);
        setFeedbackError("");
    };

    const handleSubmitFeedback =
        async () => {
            if (!selectedInterview) {
                return;
            }

            if (
                !feedbackText.trim()
            ) {
                setFeedbackError(
                    "Please enter your interview summary."
                );

                return;
            }

            try {
                setFeedbackSubmitting(
                    true
                );

                setFeedbackError("");

                const response =
                    await fetch(
                        `${API_URL}/interviews/${selectedInterview.id}/feedback`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Accept:
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body:
                                JSON.stringify({
                                    feedback:
                                        feedbackText.trim(),
                                }),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Unable to submit feedback."
                    );
                }

                setExistingFeedback(
                    data.feedback
                );

                setFeedbackText(
                    data.feedback?.feedback ||
                        feedbackText.trim()
                );
            } catch (error) {
                console.error(
                    "FEEDBACK SUBMIT ERROR:",
                    error
                );

                setFeedbackError(
                    error.message ||
                        "Unable to submit feedback."
                );
            } finally {
                setFeedbackSubmitting(
                    false
                );
            }
        };

    return (
        <div className="interviewer-dashboard">

            <header className="interviewer-header">
                <div>
                    <p className="interviewer-eyebrow">
                        INTERVIEWER
                    </p>

                    <h1>
                        My Interviews
                    </h1>

                    <p>
                        View your assigned
                        interviews and provide
                        your interview feedback.
                    </p>
                </div>

                <div className="interviewer-user">
                    <strong>
                        {user?.name ||
                            "Interviewer"}
                    </strong>

                    <span>
                        {user?.position ||
                            "Interviewer"}
                    </span>
                </div>
            </header>

            {error && (
                <div className="interviewer-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="interviewer-empty">
                    Loading interviews...
                </div>
            ) : interviews.length === 0 ? (
                <div className="interviewer-empty">
                    <h2>
                        No Interviews
                    </h2>

                    <p>
                        Interviews assigned to you
                        will appear here.
                    </p>
                </div>
            ) : (
                <div className="interviewer-list">

                    {interviews.map(
                        (interview) => (
                            <div
                                className="interview-card"
                                key={interview.id}
                            >

                                <div className="interview-candidate">
                                    <div className="interview-avatar">
                                        {getCandidateName(
                                            interview
                                        )
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <div>
                                        <strong>
                                            {getCandidateName(
                                                interview
                                            )}
                                        </strong>

                                        <span>
                                            Interview{" "}
                                            {getInterviewNumber(
                                                interview
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="interview-date">
                                    {getInterviewDate(
                                        interview
                                    )}
                                </div>

                                <div className="interview-actions">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleViewCv(
                                                interview
                                            )
                                        }
                                    >
                                        View CV
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openFeedback(
                                                interview
                                            )
                                        }
                                    >
                                        Feedback
                                    </button>

                                </div>

                            </div>
                        )
                    )}

                </div>
            )}

            {selectedInterview && (
                <div
                    className="feedback-overlay"
                    onClick={closeFeedback}
                >
                    <div
                        className="feedback-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="feedback-close"
                            onClick={
                                closeFeedback
                            }
                        >
                            ×
                        </button>

                        <p className="interviewer-eyebrow">
                            INTERVIEW FEEDBACK
                        </p>

                        <h2>
                            {getCandidateName(
                                selectedInterview
                            )}
                        </h2>

                        <p className="feedback-meta">
                            Interview{" "}
                            {getInterviewNumber(
                                selectedInterview
                            )}{" "}
                            ·{" "}
                            {getInterviewDate(
                                selectedInterview
                            )}
                        </p>

                        {feedbackLoading ? (
                            <div className="feedback-loading">
                                Loading feedback...
                            </div>
                        ) : existingFeedback ? (
                            <div className="submitted-feedback">

                                <span>
                                    Your Submitted
                                    Feedback
                                </span>

                                <p>
                                    {
                                        existingFeedback.feedback
                                    }
                                </p>

                                <small>
                                    Feedback has been
                                    submitted and
                                    cannot be edited.
                                </small>

                            </div>
                        ) : (
                            <>
                                <label>
                                    Interview Summary
                                </label>

                                <p className="feedback-help">
                                    Summarise the
                                    interview and state
                                    whether you consider
                                    the candidate capable
                                    of performing the
                                    role.
                                </p>

                                <textarea
                                    rows="8"
                                    value={
                                        feedbackText
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setFeedbackText(
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="Enter your interview assessment..."
                                />

                                {feedbackError && (
                                    <div className="feedback-error">
                                        {
                                            feedbackError
                                        }
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="submit-feedback-button"
                                    disabled={
                                        feedbackSubmitting
                                    }
                                    onClick={
                                        handleSubmitFeedback
                                    }
                                >
                                    {feedbackSubmitting
                                        ? "Submitting..."
                                        : "Submit Feedback"}
                                </button>
                            </>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
}

export default InterviewerDashboard;