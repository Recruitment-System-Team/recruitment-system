import { useEffect, useMemo, useState } from "react";

import "./HRDashboard.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api";

function HRDashboard() {
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    const token = localStorage.getItem("token");

    // =========================================================
    // THEME
    // =========================================================

    const [darkMode, setDarkMode] = useState(() => {
        return (
            localStorage.getItem("hr-theme") ===
            "dark"
        );
    });

    useEffect(() => {
        localStorage.setItem(
            "hr-theme",
            darkMode ? "dark" : "light"
        );
    }, [darkMode]);

    // =========================================================
    // MAIN STATE
    // =========================================================

    const [vacancies, setVacancies] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [profileMenuOpen, setProfileMenuOpen] =
        useState(false);

    const [error, setError] =
        useState("");

    const [applicationsLoading, setApplicationsLoading] =
        useState(true);

    const [detailsLoading, setDetailsLoading] =
        useState(false);

    const [candidateLoading, setCandidateLoading] =
        useState(false);

    const [statusUpdating, setStatusUpdating] =
        useState(false);

    const [sendingToHiringManager, setSendingToHiringManager] =
        useState(false);

   // =========================================================
// INTERVIEW STATE
// =========================================================

const [interviewOneCandidates, setInterviewOneCandidates] =
    useState([]);

const [interviewTwoCandidates, setInterviewTwoCandidates] =
    useState([]);

const [interviewers, setInterviewers] =
    useState([]);

const [selectedInterviewOneCandidate, setSelectedInterviewOneCandidate] =
    useState(null);

const [selectedInterviewTwoCandidate, setSelectedInterviewTwoCandidate] =
    useState(null);

const [interviewOneDate, setInterviewOneDate] =
    useState("");

const [interviewTwoDate, setInterviewTwoDate] =
    useState("");

const [interviewOneTime, setInterviewOneTime] =
    useState("");

const [interviewTwoTime, setInterviewTwoTime] =
    useState("");

const [selectedTechLead, setSelectedTechLead] =
    useState(null);

const [selectedSeniorEngineer, setSelectedSeniorEngineer] =
    useState(null);

const [selectedHRManager, setSelectedHRManager] =
    useState(null);

const [selectedHiringManager, setSelectedHiringManager] =
    useState(null);

const [interviewOneAvailability, setInterviewOneAvailability] =
    useState({});

const [interviewTwoAvailability, setInterviewTwoAvailability] =
    useState({});

const [selectedInterviewerProfile, setSelectedInterviewerProfile] =
    useState(null);

    
const [interviewLoading, setInterviewLoading] =
    useState(false);

const [interviewersLoading, setInterviewersLoading] =
    useState(false);

const [availabilityLoading, setAvailabilityLoading] =
    useState(false);

const [schedulingInterview, setSchedulingInterview] =
    useState(false);

const [interviewMessage, setInterviewMessage] =
    useState("");const [selectedInterviewOneVacancyId, setSelectedInterviewOneVacancyId] =
    useState("");

const [selectedInterviewTwoVacancyId, setSelectedInterviewTwoVacancyId] =
    useState("");


    const [selectedInterviewProfileCandidate, setSelectedInterviewProfileCandidate] =
    useState(null);

const [selectedInterviewProfileNumber, setSelectedInterviewProfileNumber] =
    useState(1);

const [interviewProfileStatus, setInterviewProfileStatus] =
    useState("interview");

    const [myFeedbacks, setMyFeedbacks] =
    useState([]);

    const [selectedInterviewProfileInterview, setSelectedInterviewProfileInterview] =
    useState(null);

const [interviewFeedbackText, setInterviewFeedbackText] =
    useState("");

const [existingInterviewFeedback, setExistingInterviewFeedback] =
    useState(null);

const [interviewFeedbackLoading, setInterviewFeedbackLoading] =
    useState(false);

const [interviewFeedbackSubmitting, setInterviewFeedbackSubmitting] =
    useState(false);

const [interviewFeedbackError, setInterviewFeedbackError] =
    useState("");

const [myFeedbacksLoading, setMyFeedbacksLoading] =
    useState(false);


    const [candidateFeedbacks, setCandidateFeedbacks] =
    useState([]);

const [candidateFeedbackLoading, setCandidateFeedbackLoading] =
    useState(false);

const [candidateFeedbackError, setCandidateFeedbackError] =
    useState("");

    const [showCandidateFeedback, setShowCandidateFeedback] =
    useState(false);
    // =========================================================
    // NAVIGATION
    // =========================================================

    const [activeSection, setActiveSection] =
        useState("job-postings");

    const [activeVacancyId, setActiveVacancyId] =
        useState(null);

    const [selectedVacancy, setSelectedVacancy] =
        useState(null);

    // =========================================================
    // CANDIDATES
    // =========================================================
        const [vacancyCandidateApplications, setVacancyCandidateApplications] =
    useState([]);

const [selectedCandidateIds, setSelectedCandidateIds] =
    useState([]);

const [selectedCandidate, setSelectedCandidate] =
    useState(null);
        

    const [showExtractedText, setShowExtractedText] =
        useState(false);

    const [
        expandedPrimaryCandidateId,
        setExpandedPrimaryCandidateId,
    ] = useState(null);

    const [
        primaryExtractedTextId,
        setPrimaryExtractedTextId,
    ] = useState(null);

    // =========================================================
    // NEW VACANCY
    // =========================================================


    const [showCreateVacancy, setShowCreateVacancy] = useState(false);
    const [newVacancy, setNewVacancy] = useState({
        title: "",
        department: "Human Resources",
        description: "",
        responsibilities: "",
        minimum_experience: 0,
        employment_type: "Full time",
        status: "open",
    });

    // =========================================================
    // FETCH VACANCIES
    // =========================================================

    useEffect(() => {
        fetchVacancies();
    }, []);

    useEffect(() => {
        if (token) {
            fetchApplications();
        }
    }, [token]);

    const fetchVacancies = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/job-positions`,
                {
                    method: "GET",

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
                    "Failed to load vacancies."
                );
            }

            const jobs =
                Array.isArray(data)
                    ? data
                    : data.jobs ||
                      data.data ||
                      data.job_positions ||
                      [];

            setVacancies(jobs);

        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                "Unable to load vacancies."
            );

        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // FETCH APPLICATIONS
    // =========================================================

    const fetchApplications = async () => {
        try {
            setApplicationsLoading(true);

            const response = await fetch(
                `${API_URL}/applications`,
                {
                    method: "GET",

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
                    `Failed to load applications. Status: ${response.status}`
                );
            }

            let applicationList = [];

            if (Array.isArray(data)) {
                applicationList = data;

            } else if (
                Array.isArray(
                    data.applications
                )
            ) {
                applicationList =
                    data.applications;

            } else if (
                Array.isArray(data.data)
            ) {
                applicationList =
                    data.data;
            }

            setApplications(
                applicationList
            );

        } catch (error) {
            console.error(
                "APPLICATION LOADING ERROR:",
                error
            );

            setError(
                `Could not load applications: ${error.message}`
            );

            setApplications([]);

        } finally {
            setApplicationsLoading(false);
        }
    };

    const fetchCandidateFeedback = async (applicationId) => {

    if (!applicationId) {
        return;
    }

    try {

        setCandidateFeedbackLoading(true);
        setCandidateFeedbackError("");
        setCandidateFeedbacks([]);

        const response = await fetch(
            `${API_URL}/applications/${applicationId}/interview-feedback`,
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

        setCandidateFeedbacks(
            data.feedback || []
        );

    } catch (error) {

        console.error(
            "CANDIDATE FEEDBACK ERROR:",
            error
        );

        setCandidateFeedbackError(
            error.message ||
            "Unable to load interview feedback."
        );

    } finally {

        setCandidateFeedbackLoading(false);
    }
};
    // =========================================================
    // CANDIDATE COUNT
    // =========================================================

    const getCandidateCount = (
        jobPositionId
    ) => {
        return applications.filter(
            (application) =>
                Number(
                    application.job_position_id
                ) ===
                Number(jobPositionId)
        ).length;
    };

    // =========================================================
    // VACANCIES WITH COUNTS
    // =========================================================

    const vacanciesWithCounts =
        useMemo(() => {
            return vacancies.map(
                (vacancy) => ({
                    ...vacancy,

                    candidates_count:
                        getCandidateCount(
                            vacancy.id
                        ),
                })
            );
        }, [
            vacancies,
            applications,
        ]);

    // =========================================================
    // SEARCH
    // =========================================================

    const filteredVacancies =
        useMemo(() => {
            const search =
                searchTerm
                    .trim()
                    .toLowerCase();

            if (!search) {
                return vacanciesWithCounts;
            }

            return vacanciesWithCounts.filter(
                (vacancy) =>
                    vacancy.title
                        ?.toLowerCase()
                        .includes(search) ||

                    vacancy.department
                        ?.toLowerCase()
                        .includes(search) ||

                    vacancy.employment_type
                        ?.toLowerCase()
                        .includes(search)
            );
        }, [
            vacanciesWithCounts,
            searchTerm,
        ]);

    // =========================================================
    // SUMMARY
    // =========================================================

    const openVacancies =
        vacancies.filter(
            (vacancy) =>
                String(
                    vacancy.status ||
                    "open"
                ).toLowerCase() ===
                "open"
        ).length;

    const totalCandidates =
        applications.length;

    const shortlistedCandidates =
        applications.filter(
            (application) =>
                application.status ===
                "shortlisted"
        ).length;

    // =========================================================
    // CV STATISTICS
    // =========================================================

    const getCvStats = (cv) => {
        if (!cv) {
            return {
                experience:
                    "Not available",

                skills:
                    "Not available",

                education:
                    "Not available",

                certifications:
                    "Not available",

                languages:
                    "Not available",
            };
        }

        const text =
            cv.extracted_text || "";

        const experienceMatch =
            text.match(
                /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i
            );

        const experience =
            experienceMatch
                ? `${experienceMatch[1]}+ years`
                : "Not specified";

        let skills =
            "Not specified";

        const skillsMatch =
            text.match(
                /CORE SKILLS\s*([\s\S]*?)(?:PROFESSIONAL EXPERIENCE|EXPERIENCE|EDUCATION)/i
            );

        if (skillsMatch) {
            const skillText =
                skillsMatch[1]
                    .replace(/\n/g, " ")
                    .trim();

            const skillList =
                skillText
                    .split(
                        /\s{2,}|(?=[A-Z][a-z])/
                    )
                    .map(
                        (skill) =>
                            skill.trim()
                    )
                    .filter(Boolean);

            if (
                skillList.length > 0
            ) {
                skills =
                    skillList.length >=
                    9
                        ? "9+ core skills"
                        : `${skillList.length} core skills`;
            }
        }

        let education =
            "Not specified";

        const educationMatch =
            text.match(
                /EDUCATION\s*([\s\S]*?)(?:CERTIFICATIONS|ADDITIONAL INFORMATION|PROFESSIONAL EXPERIENCE|$)/i
            );

        if (educationMatch) {
            const educationText =
                educationMatch[1]
                    .replace(/\n/g, " ")
                    .trim();

            if (educationText) {
                education =
                    educationText.length >
                    35
                        ? educationText.substring(
                              0,
                              35
                          ) + "..."
                        : educationText;
            }
        }

        let certifications =
            "Not specified";

        const certificationMatch =
            text.match(
                /CERTIFICATIONS\s*([\s\S]*?)(?:ADDITIONAL INFORMATION|$)/i
            );

        if (certificationMatch) {
            const certificationText =
                certificationMatch[1];

            const certificationLines =
                certificationText
                    .split("\n")
                    .map(
                        (line) =>
                            line.trim()
                    )
                    .filter(
                        (line) =>
                            line &&
                            !line.match(
                                /^[-•]/
                            )
                    );

            const bulletCount =
                certificationText.match(
                    /[-•]/g
                );

            const count =
                bulletCount?.length ||
                certificationLines.length;

            if (count > 0) {
                certifications =
                    `${count} certification${
                        count !== 1
                            ? "s"
                            : ""
                    }`;
            }
        }

        let languages =
            "Not specified";

        const languageMatch =
            text.match(
                /Languages?:\s*(.+)/i
            );

        if (languageMatch) {
            languages =
                languageMatch[1]
                    .split("\n")[0]
                    .trim();

            if (
                languages.length >
                35
            ) {
                languages =
                    languages.substring(
                        0,
                        35
                    ) + "...";
            }
        }

        return {
            experience,
            skills,
            education,
            certifications,
            languages,
        };
    };

    // =========================================================
    // MATCHING
    // =========================================================

    const getMatchScore = (
        application
    ) => {
        const score = Number(
            application?.match_score
        );

        if (!Number.isFinite(score)) {
            return null;
        }

        return Math.max(
            0,
            Math.min(100, score)
        );
    };

    const getMatchCategory = (
        application
    ) => {
        if (application?.category) {
            return application.category;
        }

        const score =
            getMatchScore(
                application
            );

        if (score === null) {
            return "Not evaluated";
        }

        if (score >= 80)
            return "Strong Match";

        if (score >= 60)
            return "Good Match";

        if (score >= 40)
            return "Possible Match";

        return "Weak Match";
    };

   // =========================================================
// VIEW CV
// =========================================================

const handleViewCv = async (cv) => {
    try {
        const token = localStorage.getItem("token");

        if (!cv?.id) {
            alert("CV information is not available.");
            return;
        }

        const cvApiUrl = `${API_URL}/cvs/${cv.id}/view`;

        console.log("Opening CV:", cvApiUrl);

        const response = await fetch(cvApiUrl, {
            method: "GET",
            headers: {
                Accept: "application/pdf",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "CV VIEW ERROR:",
                response.status,
                errorText
            );

            throw new Error(
                `CV request failed with status ${response.status}`
            );
        }

        const blob = await response.blob();

        const blobUrl =
            window.URL.createObjectURL(blob);

        window.open(blobUrl, "_blank");

        setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
        }, 60000);
    } catch (error) {
        console.error("CV VIEW ERROR:", error);

        alert("Unable to open the CV.");
    }
};
    // =========================================================
    // CREATE VACANCY
    // =========================================================

    const handleCreateVacancy =
        async (e) => {
            e.preventDefault();

            try {
                setError("");

                const response =
                    await fetch(
                        `${API_URL}/job-positions`,
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
                                JSON.stringify(
                                    {
                                        title:
                                            newVacancy.title,

                                        department:
                                            newVacancy.department,

                                        description:
                                            newVacancy.description,

                                        responsibilities:
                                            newVacancy.responsibilities,

                                        minimum_experience:
                                            Number(
                                                newVacancy.minimum_experience
                                            ),

                                        employment_type:
                                            newVacancy.employment_type,

                                        status:
                                            newVacancy.status,
                                    }
                                ),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Failed to create vacancy."
                    );
                }

                const createdJob =
                    data.job ||
                    data.data ||
                    data.job_position ||
                    data;

                setVacancies(
                    (
                        currentVacancies
                    ) => [
                        ...currentVacancies,
                        createdJob,
                    ]
                );

                setNewVacancy({
                    title: "",
                    department:
                        "Human Resources",
                    description: "",
                    responsibilities:
                        "",
                    minimum_experience: 0,
                    employment_type:
                        "Full time",
                    status: "open",
                });

                setShowCreateVacancy(
                    false
                );

                await fetchVacancies();

            } catch (error) {
                console.error(error);

                setError(
                    error.message ||
                    "Unable to create vacancy."
                );
            }
        };

    // =========================================================
    // OPEN VACANCY CANDIDATES
    // =========================================================

    const openVacancyCandidates = (
    vacancy
) => {
    if (!vacancy) return;

    setError("");
    setCandidateLoading(true);

        const vacancyApplications =
            applications
                .filter(
                    (application) =>
                        Number(
                            application.job_position_id
                        ) ===
                        Number(vacancy.id)
                )
                .sort((a, b) => {
                    return (
                        Number(
                            b.match_score ??
                            0
                        ) -
                        Number(
                            a.match_score ??
                            0
                        )
                    );
                });

        setSelectedVacancy(
            vacancy
        );

        setActiveVacancyId(
            vacancy.id
        );

        setVacancyCandidateApplications(
            vacancyApplications
        );

        setSelectedCandidate(
            null
        );

        setShowExtractedText(
            false
        );

        setActiveSection(
            "vacancy-candidates"
        );

        setCandidateLoading(
            false
        );
    };


    // =========================================================
    // PRIMARY SHORTLIST  ("Job Postings" flow)
    // =========================================================
    //
    // Business rule:
    // - 60%+ match score candidates only, never below.
    // - Highest 5 are eligible to send to the Hiring Manager
    //   for secondary shortlisting.
    // - Triggered ONLY from clicking a vacancy card /
    //   "Candidates" inside Job Postings.
    //
    // =========================================================

    const handleViewPrimaryShortlist = async (
        vacancyId
    ) => {
        try {
            setCandidateLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/applications`,
                {
                    method: "GET",
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
                        "Unable to load candidates."
                );
            }

            const allApplications =
                Array.isArray(data)
                    ? data
                    : data.applications ||
                      data.data ||
                      [];

            const primaryShortlist =
                allApplications
                    .filter(
                        (application) =>
                            Number(
                                application.job_position_id
                            ) ===
                                Number(
                                    vacancyId
                                ) &&
                            Number(
                                application.match_score ??
                                    0
                            ) >= 60 &&
                            application.status !==
                                "rejected"
                    )
                    .sort((a, b) => {
                        return (
                            Number(
                                b.match_score ??
                                    0
                            ) -
                            Number(
                                a.match_score ??
                                    0
                            )
                        );
                    })
                    .slice(0, 5);

            setSelectedCandidate({
                vacancyId,
                applications:
                    primaryShortlist,
                primaryShortlist: true,
            });

            setShowExtractedText(false);
            setExpandedPrimaryCandidateId(null);
            setPrimaryExtractedTextId(null);
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Unable to load primary shortlist."
            );
        } finally {
            setCandidateLoading(false);
        }
    };

    // =========================================================
    // VIEW VACANCY DETAILS
    // =========================================================

    const handleViewDetails = async (id) => {
        try {
            setDetailsLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/job-positions/${id}`,
                {
                    method: "GET",
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
                        "Unable to load vacancy details."
                );
            }

            const vacancy =
                data.job ||
                data.job_position ||
                data.data ||
                data;

            setSelectedVacancy({
                ...vacancy,
                candidates_count:
                    getCandidateCount(id),
            });

            setActiveVacancyId(id);
            setActiveSection(
                "vacancy-details"
            );
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Unable to load vacancy details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    // =========================================================
    // CLOSE APPLICATIONS
    // =========================================================

    const handleCloseApplications = async (
        id
    ) => {
        const vacancy = vacancies.find(
            (item) =>
                Number(item.id) ===
                Number(id)
        );

        if (!vacancy) return;

        const confirmed =
            window.confirm(
                `Are you sure you want to close applications for "${vacancy.title}"?\n\nCandidates will no longer be able to apply, but existing applications will remain available.`
            );

        if (!confirmed) return;

        try {
            setError("");

            const response = await fetch(
                `${API_URL}/job-positions/${id}/close`,
                {
                    method: "PATCH",
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
                        "Unable to close applications."
                );
            }

            setVacancies(
                (currentVacancies) =>
                    currentVacancies.map(
                        (item) =>
                            Number(item.id) ===
                            Number(id)
                                ? {
                                      ...item,
                                      status: "closed",
                                  }
                                : item
                    )
            );
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Unable to close applications."
            );
        }
    };

    // =========================================================
    // DELETE VACANCY
    // =========================================================

    const handleDeleteVacancy = async (
        id
    ) => {
        const vacancy = vacancies.find(
            (item) =>
                Number(item.id) ===
                Number(id)
        );

        if (!vacancy) return;

        const confirmed =
            window.confirm(
                `Are you sure you want to delete "${vacancy.title}"?\n\nThis action cannot be undone.`
            );

        if (!confirmed) return;

        try {
            setError("");

            const response = await fetch(
                `${API_URL}/job-positions/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Accept:
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to delete vacancy."
                );
            }

            setVacancies(
                (currentVacancies) =>
                    currentVacancies.filter(
                        (item) =>
                            Number(item.id) !==
                            Number(id)
                    )
            );

            setApplications(
                (currentApplications) =>
                    currentApplications.filter(
                        (application) =>
                            Number(
                                application.job_position_id
                            ) !==
                            Number(id)
                    )
            );

            if (
                Number(activeVacancyId) ===
                Number(id)
            ) {
                setActiveVacancyId(null);
                setSelectedVacancy(null);
                setVacancyCandidateApplications(
                    []
                );
                setActiveSection(
                    "job-postings"
                );
            }
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Unable to delete vacancy."
            );
        }
    };

    // =========================================================
    // SEND TOP 5 TO HIRING MANAGER
    // =========================================================

    const handleSendToHiringManager =
        async () => {
            if (
                !selectedCandidate?.vacancyId
            ) {
                return;
            }

            const confirmed =
                window.confirm(
                    "Send the top 5 eligible candidates for this vacancy to the Hiring Manager for secondary shortlisting?"
                );

            if (!confirmed) return;

            try {
                setSendingToHiringManager(
                    true
                );

                setError("");

                const response =
                    await fetch(
                        `${API_URL}/applications/send-to-hiring-manager`,
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
                            body: JSON.stringify(
                                {
                                    job_position_id:
                                        selectedCandidate.vacancyId,
                                }
                            ),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Unable to send candidates to the Hiring Manager."
                    );
                }

                const sentApplications =
                    data.applications ||
                    [];

                setSelectedCandidate(
                    (current) => {
                        if (!current)
                            return current;

                        return {
                            ...current,
                            applications:
                                sentApplications.length >
                                0
                                    ? sentApplications
                                    : current.applications,
                        };
                    }
                );

                await fetchApplications();

                alert(
                    "The top eligible candidates have been sent to the Hiring Manager."
                );
            } catch (error) {
                console.error(
                    "SEND TO HIRING MANAGER ERROR:",
                    error
                );

                setError(
                    error.message ||
                        "Unable to send candidates to the Hiring Manager."
                );
            } finally {
                setSendingToHiringManager(
                    false
                );
            }
        };

    // =========================================================
    // UPDATE APPLICATION STATUS
    // =========================================================

    const handleStatusChange = async (
        applicationId,
        newStatus
    ) => {
         if (newStatus === "selected") {
        const confirmed = window.confirm(
            "Are you sure you want to select this candidate? A selection email will be sent."
        );

        if (!confirmed) {
            return;
        }
    }

    if (newStatus === "rejected") {
        const confirmed = window.confirm(
            "Are you sure you want to reject this candidate? A rejection email will be sent."
        );

        if (!confirmed) {
            return;
        }
    }
        try {
            setStatusUpdating(true);
            setError("");

            const response = await fetch(
                `${API_URL}/applications/${applicationId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept:
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status: newStatus,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to update application status."
                );
            }

            setVacancyCandidateApplications(
                (current) =>
                    current.map(
                        (application) =>
                            application.id ===
                            applicationId
                                ? {
                                      ...application,
                                      status: newStatus,
                                  }
                                : application
                    )
            );

            setSelectedCandidate(
                (current) => {
                    if (!current)
                        return current;

                    return {
                        ...current,
                        applications:
                            current.applications.map(
                                (
                                    application
                                ) =>
                                    application.id ===
                                    applicationId
                                        ? {
                                              ...application,
                                              status: newStatus,
                                          }
                                        : application
                            ),
                    };
                }
            );

            await fetchApplications();
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Unable to update application status."
            );
        } finally {
            setStatusUpdating(false);
        }
    };

    
const fetchMyFeedbacks = async () => {
    try {
        setMyFeedbacksLoading(true);

        const response = await fetch(
            `${API_URL}/interviews/my-feedbacks`,
            {
                headers: {
                    Accept: "application/json",
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
                    "Unable to load your feedback."
            );
        }

        setMyFeedbacks(
            data.feedback || []
        );
    } catch (error) {
        console.error(
            "MY FEEDBACKS ERROR:",
            error
        );

        setError(
            error.message ||
                "Unable to load your feedback."
        );
    } finally {
        setMyFeedbacksLoading(false);
    }
};


const handleRejectSelectedCandidates = async () => {
    if (selectedCandidateIds.length === 0) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to reject ${selectedCandidateIds.length} selected candidate(s)?`
    );

    if (!confirmed) {
        return;
    }

    try {
        setStatusUpdating(true);
        setError("");

        const responses = await Promise.all(
            selectedCandidateIds.map((applicationId) =>
                fetch(
                    `${API_URL}/applications/${applicationId}/status`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            status: "rejected",
                        }),
                    }
                )
            )
        );

        const failedResponse = responses.find(
            (response) => !response.ok
        );

        if (failedResponse) {
            const data = await failedResponse
                .json()
                .catch(() => ({}));

            throw new Error(
                data.message ||
                    "Unable to reject some candidates."
            );
        }

        setVacancyCandidateApplications((current) =>
            current.map((application) =>
                selectedCandidateIds.includes(
                    application.id
                )
                    ? {
                          ...application,
                          status: "rejected",
                      }
                    : application
            )
        );

        setApplications((current) =>
            current.map((application) =>
                selectedCandidateIds.includes(
                    application.id
                )
                    ? {
                          ...application,
                          status: "rejected",
                      }
                    : application
            )
        );

        setSelectedCandidateIds([]);

        alert(
            "Selected candidates have been rejected and rejection emails have been triggered."
        );
    } catch (error) {
        console.error(
            "BULK REJECTION ERROR:",
            error
        );

        setError(
            error.message ||
                "Unable to reject selected candidates."
        );
    } finally {
        setStatusUpdating(false);
    }
};

    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href =
            import.meta.env.BASE_URL;
    };

    // =========================================================
    // REFRESH
    // =========================================================

    const handleRefresh = async () => {
        await Promise.all([
            fetchVacancies(),
            fetchApplications(),
        ]);

        if (
            selectedVacancy &&
            activeSection ===
                "vacancy-candidates"
        ) {
            const refreshedVacancy =
                vacancies.find(
                    (vacancy) =>
                        Number(vacancy.id) ===
                        Number(
                            selectedVacancy.id
                        )
                );

            if (refreshedVacancy) {
                openVacancyCandidates(
                    refreshedVacancy
                );
            }
        }
    };

    // =========================================================
    // SIDEBAR NAVIGATION HELPERS
    // =========================================================

    const goToJobPostings = () => {
        setActiveSection(
            "job-postings"
        );
        setActiveVacancyId(null);
        setSelectedVacancy(null);
        setSelectedCandidate(null);
        setVacancyCandidateApplications(
            []
        );
    };

    const goToInbox = () => {
        setActiveSection("inbox");
        setActiveVacancyId(null);
        setSelectedVacancy(null);
        setSelectedCandidate(null);
    };

    const goToVacancies = () => {
        setActiveSection("vacancies");
        setActiveVacancyId(null);
        setSelectedVacancy(null);
        setSelectedCandidate(null);
    };

    const goToInterview = () => {
        setActiveSection("interview");
        setActiveVacancyId(null);
        setSelectedVacancy(null);
        setSelectedCandidate(null);

         loadInterviewData();
    };

    const goToMyFeedbacks = () => {
    setActiveSection("my-feedbacks");
    setActiveVacancyId(null);
    setSelectedVacancy(null);
    setSelectedCandidate(null);

    fetchMyFeedbacks();
};
// =========================================================
// INTERVIEW DATA
// =========================================================
const openInterviewProfile = async (
    application,
    interviewNumber,
    interview = null
) => {
    setSelectedInterviewProfileCandidate(application);
    setSelectedInterviewProfileNumber(interviewNumber);
    setSelectedInterviewProfileInterview(interview);

    fetchCandidateFeedback(application?.id);

    const currentStatus =
        String(application.status || "").toLowerCase();

    if (currentStatus === "rejected") {
        setInterviewProfileStatus("rejected");
    } else if (currentStatus === "selected") {
        setInterviewProfileStatus("selected");
    } else {
        setInterviewProfileStatus("interview");
    }

    /*
     * Load feedback for Interview 2
     */
    if (interviewNumber === 2 && interview?.id) {

        setInterviewFeedbackText("");
        setExistingInterviewFeedback(null);
        setInterviewFeedbackError("");
        setInterviewFeedbackLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/interviews/${interview.id}/feedback`,
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

            if (data.feedback) {
                setExistingInterviewFeedback(data.feedback);

                setInterviewFeedbackText(
                    data.feedback.feedback || ""
                );
            }

        } catch (error) {

            console.error(
                "INTERVIEW 2 FEEDBACK LOAD ERROR:",
                error
            );

            setInterviewFeedbackError(
                error.message ||
                "Unable to load feedback."
            );

        } finally {
            setInterviewFeedbackLoading(false);
        }
    }
};

const handleSubmitInterviewFeedback = async () => {

    if (!selectedInterviewProfileInterview?.id) {
        return;
    }

    if (!interviewFeedbackText.trim()) {
        setInterviewFeedbackError(
            "Please enter interview feedback."
        );
        return;
    }

    try {

        setInterviewFeedbackSubmitting(true);
        setInterviewFeedbackError("");

        const response = await fetch(
            `${API_URL}/interviews/${selectedInterviewProfileInterview.id}/feedback`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    feedback: interviewFeedbackText.trim(),
                }),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Unable to submit interview feedback."
            );
        }

        setExistingInterviewFeedback(
            data.feedback
        );

        setInterviewFeedbackText(
            data.feedback?.feedback ||
            interviewFeedbackText
        );

        await fetchMyFeedbacks();

    } catch (error) {

        console.error(
            "INTERVIEW 2 FEEDBACK SUBMIT ERROR:",
            error
        );

        setInterviewFeedbackError(
            error.message ||
            "Unable to submit interview feedback."
        );

    } finally {
        setInterviewFeedbackSubmitting(false);
    }
};
const fetchInterviewOneCandidates = async () => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/interviews/interview-one/candidates`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch Interview 1 candidates.");
        }

        const data = await response.json();

        setInterviewOneCandidates(
            data.applications || []
        );
    } catch (error) {
        console.error(
            "INTERVIEW 1 CANDIDATES ERROR:",
            error
        );

        setError(
            "Unable to load Interview 1 candidates."
        );
    }
};


const fetchInterviewTwoCandidates = async () => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/interviews/interview-two/candidates`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch Interview 2 candidates.");
        }

        const data = await response.json();

        setInterviewTwoCandidates(
            data.applications || []
        );
    } catch (error) {
        console.error(
            "INTERVIEW 2 CANDIDATES ERROR:",
            error
        );

        setError(
            "Unable to load Interview 2 candidates."
        );
    }
};


const fetchInterviewers = async () => {
    try {
        const token = localStorage.getItem("token");

        setInterviewersLoading(true);

        const response = await fetch(
            `${API_URL}/interviews/interviewers`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(
                "Failed to fetch interview participants."
            );
        }

        const data = await response.json();

        setInterviewers(
            data.interviewers || []
        );
    } catch (error) {
        console.error(
            "INTERVIEWERS ERROR:",
            error
        );

        setError(
            "Unable to load interview participants."
        );
    } finally {
        setInterviewersLoading(false);
    }
};
const fetchInterviewerAvailability = async (
    date,
    interviewNumber,
    startTime = ""
) => {
    if (!date) {
        if (interviewNumber === 1) {
            setInterviewOneAvailability({});
        } else {
            setInterviewTwoAvailability({});
        }

        return;
    }

    try {
        const token =
            localStorage.getItem("token");

        setAvailabilityLoading(true);

        const participants =
            interviewers.filter((interviewer) => {
                if (interviewNumber === 1) {
                    return (
                        interviewer.position ===
                            "Tech Lead" ||
                        interviewer.position ===
                            "Senior Software Engineer"
                    );
                }

                return (
                    interviewer.position ===
                        "HR Manager" ||
                    interviewer.position ===
                        "Hiring Manager"
                );
            });

        const results =
            await Promise.all(
                participants.map(
                    async (interviewer) => {
                        try {
                            const response =
                                await fetch(
                                    `${API_URL}/interviews/interviewer-availability?user_id=${interviewer.id}&date=${date}${startTime ? `&start_time=${startTime}` : ""}`,
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

                            return {
                                user_id:
                                    interviewer.id,

                                name:
                                    interviewer.name,

                                email:
                                    interviewer.email,

                                position:
                                    interviewer.position,

                                connected:
                                    data.connected ===
                                    true,

                                available:
                                    data.available ===
                                    true,

                                suggested_time:
                                    data.suggested_time ||
                                    null,
                            };
                        } catch (error) {
                            console.error(
                                "AVAILABILITY ERROR:",
                                interviewer.name,
                                error
                            );

                            return {
                                user_id:
                                    interviewer.id,

                                name:
                                    interviewer.name,

                                email:
                                    interviewer.email,

                                position:
                                    interviewer.position,

                                connected: false,
                                available: false,
                                suggested_time: null,
                            };
                        }
                    }
                )
            );

        const availabilityMap = {};

        results.forEach((result) => {
            availabilityMap[result.user_id] =
                result;
        });

        if (interviewNumber === 1) {
            setInterviewOneAvailability(
                availabilityMap
            );
        } else {
            setInterviewTwoAvailability(
                availabilityMap
            );
        }
    } catch (error) {
        console.error(
            "INTERVIEW AVAILABILITY ERROR:",
            error
        );

        setInterviewMessage(
            "Unable to check staff calendar availability."
        );
    } finally {
        setAvailabilityLoading(false);
    }
};

const checkSelectedInterviewerAvailability = async (
    interviewer,
    date,
    startTime = ""
) => {
    if (!interviewer || !date) {
        return {
            connected: false,
            available: false,
            suggested_time: null,
        };
    }


    try {
        const token =
            localStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/interviews/interviewer-availability?user_id=${interviewer.id}&date=${date}${startTime ? `&start_time=${startTime}` : ""}`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization:
                        `Bearer ${token}`,
                },
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            return {
                connected: data.connected === true,
                available: false,
                suggested_time: null,
            };
        }

        return {
            connected:
                data.connected === true,

            available:
                data.available === true,

            suggested_time:
                data.suggested_time ||
                null,
        };
    } catch (error) {
        console.error(
            "SELECTED INTERVIEWER AVAILABILITY ERROR:",
            interviewer.name,
            error
        );

        return {
            connected: false,
            available: false,
            suggested_time: null,
        };
    }
};

useEffect(() => {
    if (interviewOneDate) {
        fetchInterviewerAvailability(
            interviewOneDate,
            1,
            interviewOneTime
        );
    } else {
        setInterviewOneAvailability({});
    }
}, [
    interviewOneDate,
    interviewOneTime,
    interviewers,
]);

useEffect(() => {
    if (interviewTwoDate) {
        fetchInterviewerAvailability(
            interviewTwoDate,
            2,
            interviewTwoTime
        );
    } else {
        setInterviewTwoAvailability({});
    }
}, [
    interviewTwoDate,
    interviewTwoTime,
    interviewers,
]);

const getInterviewersByPosition = (
    position
) => {
    return interviewers.filter(
        (interviewer) =>
            interviewer.position === position
    );
};

const isStaffAvailable = (
    interviewer,
    interviewNumber
) => {
    const availability =
        interviewNumber === 1
            ? interviewOneAvailability
            : interviewTwoAvailability;

    return (
        availability[interviewer.id]
            ?.available === true
    );
};

const getAvailabilityInfo = (
    interviewer,
    interviewNumber
) => {
    const availability =
        interviewNumber === 1
            ? interviewOneAvailability
            : interviewTwoAvailability;

    return (
        availability[interviewer.id] ||
        null
    );
};

const getInterviewerPosition = (
    interviewer
) => {
    return (
        interviewer?.position ||
        interviewer?.role?.name ||
        "Staff"
    );
};

const handleInterviewerProfile = (
    interviewer
) => {
    setSelectedInterviewerProfile(
        interviewer
    );
};
const handleScheduleInterview = async (
    interviewNumber
) => {
    try {
        /*
         * This Interview room already belongs to one vacancy.
         * Get that vacancy from the candidates currently shown
         * in this room. We are NOT selecting a candidate for
         * scheduling; we only need the vacancy ID.
         */
        const candidates =
            interviewNumber === 1
                ? interviewOneCandidates
                : interviewTwoCandidates;

        const firstApplication =
            candidates[0];

        const jobPositionId =
            firstApplication?.job_position_id ||
            firstApplication?.jobPosition?.id;

        if (!jobPositionId) {
            alert(
                "Unable to determine the vacancy for this interview."
            );
            return;
        }

        const date =
            interviewNumber === 1
                ? interviewOneDate
                : interviewTwoDate;

        const time =
            interviewNumber === 1
                ? interviewOneTime
                : interviewTwoTime;

        if (!date) {
            alert(
                "Please select an interview date."
            );
            return;
        }

        if (!time) {
            alert(
                "Please select the interview start time."
            );
            return;
        }

        if (interviewNumber === 1) {

            if (!selectedTechLead) {
                alert(
                    "Please select a Tech Lead."
                );
                return;
            }

            if (!selectedSeniorEngineer) {
                alert(
                    "Please select a Senior Software Engineer."
                );
                return;
            }

            if (
                Number(selectedTechLead.id) ===
                Number(selectedSeniorEngineer.id)
            ) {
                alert(
                    "Tech Lead and Senior Software Engineer must be different people."
                );
                return;
            }

            if (
                !isStaffAvailable(
                    selectedTechLead,
                    1
                )
            ) {
                alert(
                    "The selected Tech Lead is not available for the selected 2-hour block."
                );
                return;
            }

            if (
                !isStaffAvailable(
                    selectedSeniorEngineer,
                    1
                )
            ) {
                alert(
                    "The selected Senior Software Engineer is not available for the selected 2-hour block."
                );
                return;
            }
        }

        if (interviewNumber === 2) {

            if (!selectedHRManager) {
                alert(
                    "Please select the HR Manager."
                );
                return;
            }

            if (!selectedHiringManager) {
                alert(
                    "Please select the Hiring Manager."
                );
                return;
            }

            if (
                !isStaffAvailable(
                    selectedHRManager,
                    2
                )
            ) {
                alert(
                    "The selected HR Manager is not available for the selected 2-hour block."
                );
                return;
            }

            if (
                !isStaffAvailable(
                    selectedHiringManager,
                    2
                )
            ) {
                alert(
                    "The selected Hiring Manager is not available for the selected 2-hour block."
                );
                return;
            }
        }

        setSchedulingInterview(true);

        const token =
            localStorage.getItem("token");

        const body = {
            job_position_id:
                Number(jobPositionId),

            interview_number:
                interviewNumber,

            scheduled_date:
                date,

            scheduled_time:
                time,
        };

        if (interviewNumber === 1) {
            body.tech_lead_id =
                Number(selectedTechLead.id);

            body.senior_engineer_id =
                Number(selectedSeniorEngineer.id);
        }

        if (interviewNumber === 2) {
            body.hr_manager_id =
                Number(selectedHRManager.id);

            body.hiring_manager_id =
                Number(selectedHiringManager.id);
        }

        const response =
            await fetch(
                `${API_URL}/interviews`,
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
                        JSON.stringify(body),
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            console.error(
                "SCHEDULE INTERVIEW ERROR:",
                data
            );

            throw new Error(
                data.message ||
                "Unable to schedule interview."
            );
        }

        alert(
            `Interview ${interviewNumber} has been scheduled and locked for this vacancy.`
        );

        await loadInterviewData();

        setInterviewMessage("");

        setSelectedInterviewProfileCandidate(
            null
        );

    } catch (error) {

        console.error(
            "SCHEDULE INTERVIEW ERROR:",
            error
        );

        alert(
            error.message ||
            "Unable to schedule interview."
        );

    } finally {
        setSchedulingInterview(false);
    }
};
const handleMoveToInterviewTwo = async (
    applicationId
) => {
    try {
        const token =
            localStorage.getItem("token");

        const response = await fetch(
            `${API_URL}/interviews/move-to-interview-two`,
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

                body: JSON.stringify({
                    application_id:
                        applicationId,
                }),
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                    "Unable to move candidate."
            );
        }

        const movedCandidate =
            interviewOneCandidates.find(
                (application) =>
                    application.id ===
                    applicationId
            );

        setInterviewMessage(
            "✓ Candidate has been moved to Interview 2."
        );

        setInterviewOneCandidates(
            (current) =>
                current.map(
                    (application) =>
                        application.id ===
                        applicationId
                            ? {
                                  ...application,
                                  moved_to_interview_two:
                                      true,
                              }
                            : application
                )
        );

        if (movedCandidate) {
            setInterviewTwoCandidates(
                (current) => {
                    const exists =
                        current.some(
                            (application) =>
                                application.id ===
                                applicationId
                        );

                    if (exists) {
                        return current;
                    }

                    return [
                        ...current,
                        {
                            ...movedCandidate,
                            moved_to_interview_two:
                                true,
                        },
                    ];
                }
            );
        }
    } catch (error) {
        console.error(
            "MOVE TO INTERVIEW 2 ERROR:",
            error
        );

        setInterviewMessage(
            error.message ||
                "Unable to move candidate."
        );
    }
};



const loadInterviewData = async () => {
    try {
        setInterviewLoading(true);
        setError("");

        await Promise.all([
            fetchInterviewOneCandidates(),
            fetchInterviewTwoCandidates(),
            fetchInterviewers(),

        ]);
    } catch (error) {
        console.error(
            "INTERVIEW DATA ERROR:",
            error
        );
    } finally {
        setInterviewLoading(false);
    }
};

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div
            className={`dashboard ${
                darkMode
                    ? "dark-mode"
                    : "light-mode"
            }`}
        >
            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="sidebar">
                <div className="company">
                    <div className="company-logo"></div>

                    <span>
                        Altrium MG
                    </span>

                    <span className="dropdown">
                        
                    </span>
                </div>

                <div className="sidebar-menu">
                    {/* HOME */}

                    <div className="menu-title">
                        HOME
                    </div>

                    {/* JOB POSTINGS */}

                    <button
                        type="button"
                        className={`menu-item ${
                            activeSection ===
                            "job-postings"
                                ? "active"
                                : ""
                        }`}
                        onClick={
                            goToJobPostings
                        }
                    >
                        <span>▤</span>
                        Job Postings
                    </button>

                    {/* INBOX */}

                    <button
                        type="button"
                        className={`menu-item ${
                            activeSection ===
                            "inbox"
                                ? "active"
                                : ""
                        }`}
                        onClick={
                            goToInbox
                        }
                    >
                        <span>✉</span>
                        Inbox
                    </button>

                    <hr />

                    {/* RECRUITMENT */}

                    <div className="section-title">
                        RECRUITMENT
                    </div>

                    {/* VACANCIES */}

                    <button
                        type="button"
                        className={`menu-item vacancy-parent-title ${
                            activeSection ===
                                "vacancies" ||
                            activeSection ===
                                "vacancy-candidates" ||
                            activeSection ===
                                "vacancy-details"
                                ? "active"
                                : ""
                        }`}
                        onClick={
                            goToVacancies
                        }
                    >
                        <span>⌄</span>
                        Vacancies
                    </button>

                    {/* DYNAMIC VACANCIES (Vacancies > Job Title > Candidates) */}

                    <div className="sidebar-vacancies">
                        {loading ? (
                            <div className="sidebar-loading">
                                Loading...
                            </div>
                        ) : vacancies.length ===
                          0 ? (
                            <div className="sidebar-empty">
                                No vacancies
                            </div>
                        ) : (
                            vacancies.map(
                                (
                                    vacancy
                                ) => (
                                    <div
                                        className="sidebar-vacancy"
                                        key={
                                            vacancy.id
                                        }
                                    >
                                        {/* VACANCY NAME */}

                                        <button
                                            type="button"
                                            className={`sidebar-vacancy-name ${
                                                Number(
                                                    activeVacancyId
                                                ) ===
                                                    Number(
                                                        vacancy.id
                                                    ) &&
                                                activeSection ===
                                                    "vacancy-candidates"
                                                    ? "selected"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                openVacancyCandidates(
                                                    vacancy
                                                )
                                            }
                                        >
                                            <span className="vacancy-arrow">
                                                ›
                                            </span>

                                            <span className="sidebar-vacancy-title">
                                                {
                                                    vacancy.title
                                                }
                                            </span>
                                        </button>

                                        {/* CANDIDATES CHILD */}

                                        <button
                                            type="button"
                                            className={`sidebar-candidates ${
                                                Number(
                                                    activeVacancyId
                                                ) ===
                                                    Number(
                                                        vacancy.id
                                                    ) &&
                                                activeSection ===
                                                    "vacancy-candidates"
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                openVacancyCandidates(
                                                    vacancy
                                                )
                                            }
                                        >
                                            <span className="candidate-tree">
                                                └
                                            </span>

                                            <span>
                                                Candidates
                                            </span>

                                            <span className="sidebar-count">
                                                {getCandidateCount(
                                                    vacancy.id
                                                )}
                                            </span>
                                        </button>
                                    </div>
                                )
                            )
                        )}
                    </div>

                    {/* INTERVIEW */}

                    <button
                        type="button"
                        className={`menu-item interview-menu-item ${
                            activeSection ===
                            "interview"
                                ? "active"
                                : ""
                        }`}
                        onClick={
                            goToInterview
                        }
                    >
                        <span>✓</span>
                        Interview
                    </button>

                    <button
    type="button"
    className={`menu-item ${
        activeSection ===
        "my-feedbacks"
            ? "active"
            : ""
    }`}
    onClick={
        goToMyFeedbacks
    }
>
    <span>✎</span>
    My Feedbacks
</button>

                </div>

                {/* PROFILE */}

                <div className="profile-wrapper">
                    <button
                        className="profile-button"
                        onClick={() =>
                            setProfileMenuOpen(
                                !profileMenuOpen
                            )
                        }
                    >
                        <span>
                            ◉
                        </span>

                        <div>
                            <strong>
                                {user?.name ||
                                    "HR Manager"}
                            </strong>

                            <small>
                                {user?.role ||
                                    "HR Manager"}
                            </small>
                        </div>
                    </button>

                    {profileMenuOpen && (
                        <div className="profile-menu">
                            <button
                                className="profile-menu-item"
                                onClick={() =>
                                    setProfileMenuOpen(
                                        false
                                    )
                                }
                            >
                                Profile
                            </button>

                            <button
                                className="profile-menu-item logout-item"
                                onClick={
                                    handleLogout
                                }
                            >
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="dashboard-content">
                {/* TOP BAR */}

                <header className="topbar">
                    <button
                        className="theme-toggle"
                        onClick={() =>
                            setDarkMode(
                                !darkMode
                            )
                        }
                        aria-label="Toggle theme"
                    >
                        <span className="theme-icon">
                            {darkMode
                                ? "☀"
                                : "☾"}
                        </span>

                        <span>
                            {darkMode
                                ? "Light"
                                : "Dark"}
                        </span>
                    </button>
                </header>

                {/* ERROR */}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {/* =================================================
                    JOB POSTINGS
                    -> Candidates click here = PRIMARY SHORTLIST
                       (>=60%, top 5, send to Hiring Manager)
                ================================================= */}

                {activeSection ===
                    "job-postings" && (
                    <>
                        <div className="page-header">
                            <div>
                                <p className="page-eyebrow">
                                    RECRUITMENT
                                    MANAGEMENT
                                </p>

                                <h1>
                                    Job Postings
                                </h1>

                                <p className="page-description">
    Review candidates assigned to you for
    Interview 2 and submit your interview
    assessments.
</p>
                            </div>

                            <div className="header-actions">
                                <button
    type="button"
    className="refresh-button"
    onClick={handleRefresh}
    title="Refresh dashboard"
    aria-label="Refresh dashboard"
>
    ↻
</button>

                                <button
                                    className="create-vacancy-button"
                                    onClick={() =>
                                        setShowCreateVacancy(
                                            true
                                        )
                                    }
                                >
                                    <span>
                                        ＋
                                    </span>

                                    Create Vacancy
                                </button>
                            </div>
                        </div>

                        {/* SUMMARY */}

                        <div className="vacancy-summary">
                            <div>
                                <strong>
                                    {
                                        openVacancies
                                    }
                                </strong>

                                <span>
                                    Open vacancies
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        totalCandidates
                                    }
                                </strong>

                                <span>
                                    Total candidates
                                </span>
                            </div>

                            <div>
                                <strong>
                                    {
                                        shortlistedCandidates
                                    }
                                </strong>

                                <span>
                                    Shortlisted
                                </span>
                            </div>
                        </div>

                        {/* VACANCY CARDS */}

                        {loading ? (
                            <div className="loading-message">
                                Loading
                                vacancies...
                            </div>
                        ) : filteredVacancies.length ===
                          0 ? (
                            <div className="empty-vacancy-card">
                                {searchTerm ? (
                                    <>
                                        <h2>
                                            No vacancies
                                            found
                                        </h2>

                                        <p>
                                            Try searching
                                            for a
                                            different
                                            position or
                                            department.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2>
                                            No vacancies
                                            yet
                                        </h2>

                                        <p>
                                            Create your
                                            first
                                            vacancy to
                                            start
                                            recruiting
                                            candidates.
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="job-grid">
                                {filteredVacancies.map(
                                    (
                                        vacancy
                                    ) => (
                                        <div
                                            className="job-card"
                                            key={
                                                vacancy.id
                                            }
                                        >
                                            {/* CLICKABLE VACANCY AREA -> PRIMARY SHORTLIST */}

                                            <div
                                                className="job-card-inner"
                                                onClick={() =>
                                                    handleViewPrimaryShortlist(
                                                        vacancy.id
                                                    )
                                                }
                                                style={{
                                                    cursor:
                                                        "pointer",
                                                }}
                                            >
                                                <div className="job-date">
                                                    {(
                                                        vacancy.status ||
                                                        "open"
                                                    ).toUpperCase()}
                                                </div>

                                                <div className="job-status"></div>

                                                <p className="company-name">
                                                    Altrium
                                                </p>

                                                <h2>
                                                    {
                                                        vacancy.title
                                                    }
                                                </h2>

                                                <div className="job-tags">
                                                    <span>
                                                        {
                                                            vacancy.employment_type ||
                                                            "Full time"
                                                        }
                                                    </span>

                                                    <span>
                                                        {
                                                            vacancy.department ||
                                                            "Human Resources"
                                                        }
                                                    </span>

                                                    <span>
                                                        {vacancy.minimum_experience
                                                            ? `${vacancy.minimum_experience}+ years`
                                                            : "No experience"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* CARD FOOTER */}

                                            <div className="job-footer">
                                                <div className="candidate-info">
                                                    <strong>
                                                        CANDIDATES
                                                    </strong>

                                                    <span className="candidate-count">
                                                        {
                                                            vacancy.candidates_count
                                                        }
                                                    </span>
                                                </div>

                                                <div className="job-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewPrimaryShortlist(
                                                                vacancy.id
                                                            )
                                                        }
                                                    >
                                                        Candidates
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewDetails(
                                                                vacancy.id
                                                            )
                                                        }
                                                    >
                                                        Details
                                                        →
                                                    </button>

                                                    {String(
                                                        vacancy.status ||
                                                            "open"
                                                    ).toLowerCase() ===
                                                        "open" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleCloseApplications(
                                                                    vacancy.id
                                                                )
                                                            }
                                                        >
                                                            Close
                                                            Applications
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeleteVacancy(
                                                                vacancy.id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                        Vacancy
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* =================================================
                    VACANCIES
                    -> Candidates click here = FULL applicant list
                       in simple columns (name / score / profile).
                       No Close Applications / Delete Vacancy here.
                ================================================= */}

                {activeSection ===
                    "vacancies" && (
                    <section className="dashboard-section">
                        <div className="page-header">
                            <div>
                                <p className="page-eyebrow">
                                    RECRUITMENT
                                </p>

                                <h1>
                                    Vacancies
                                </h1>

                                <p className="page-description">
                                    Select a vacancy
                                    to view its
                                    recruitment
                                    candidates.
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-message">
                                Loading
                                vacancies...
                            </div>
                        ) : filteredVacancies.length ===
                          0 ? (
                            <div className="empty-vacancy-card">
                                <h2>
                                    No vacancies yet
                                </h2>

                                <p>
                                    Create a vacancy
                                    from Job
                                    Postings.
                                </p>
                            </div>
                        ) : (
                            <div className="job-grid">
                                {filteredVacancies.map(
                                    (
                                        vacancy
                                    ) => (
                                        <div
                                            className="job-card"
                                            key={
                                                vacancy.id
                                            }
                                        >
                                            <div
                                                className="job-card-inner"
                                                onClick={() =>
                                                    openVacancyCandidates(
                                                        vacancy
                                                    )
                                                }
                                                style={{
                                                    cursor:
                                                        "pointer",
                                                }}
                                            >
                                                <div className="job-date">
                                                    {(
                                                        vacancy.status ||
                                                        "open"
                                                    ).toUpperCase()}
                                                </div>

                                                <div className="job-status"></div>

                                                <p className="company-name">
                                                    Altrium
                                                </p>

                                                <h2>
                                                    {
                                                        vacancy.title
                                                    }
                                                </h2>

                                                <div className="job-tags">
                                                    <span>
                                                        {
                                                            vacancy.employment_type ||
                                                            "Full time"
                                                        }
                                                    </span>

                                                    <span>
                                                        {
                                                            vacancy.department ||
                                                            "Human Resources"
                                                        }
                                                    </span>

                                                    <span>
                                                        {vacancy.minimum_experience
                                                            ? `${vacancy.minimum_experience}+ years`
                                                            : "No experience"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="job-footer">
                                                <div className="candidate-info">
                                                    <strong>
                                                        CANDIDATES
                                                    </strong>

                                                    <span className="candidate-count">
                                                        {
                                                            vacancy.candidates_count
                                                        }
                                                    </span>
                                                </div>

                                                <div className="job-actions">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openVacancyCandidates(
                                                                vacancy
                                                            )
                                                        }
                                                    >
                                                        Candidates
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewDetails(
                                                                vacancy.id
                                                            )
                                                        }
                                                    >
                                                        Details
                                                        →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* =================================================
                    VACANCY CANDIDATES PAGE (Vacancies flow)
                    Order: Hiring Manager Shortlist -> Shortlisted
                    -> All Candidates. Simple columns only.
                ================================================= */}

                {activeSection ===
                    "vacancy-candidates" &&
                    selectedVacancy && (
                        <section className="dashboard-section">
                            <div className="page-header">
                                <div>
                                    <p className="page-eyebrow">
                                        RECRUITMENT
                                    </p>

                                    <h1>
                                        Candidates
                                    </h1>

                                    <p className="page-description">
                                        Candidates for{" "}
                                        <strong>
                                            {
                                                selectedVacancy.title
                                            }
                                        </strong>
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="refresh-button"
                                    onClick={() =>
                                        openVacancyCandidates(
                                            selectedVacancy
                                        )
                                    }
                                >
                                    ↻
                                </button>
                            </div>

                            {candidateLoading ||
                            applicationsLoading ? (
                                <div className="loading-message">
                                    Loading
                                    candidates...
                                </div>
                            ) : (
                                <>
                                    {/* =================================================
                                        HIRING MANAGER SHORTLIST
                                        Candidates the Hiring Manager has
                                        further shortlisted after receiving
                                        the primary top-5.
                                    ================================================= */}

                                    <div className="candidate-section-heading">
                                        <div>
                                            <p className="page-eyebrow">
                                                HIRING MANAGER
                                            </p>

                                            <h2>
                                                Hiring Manager Shortlist
                                            </h2>
                                        </div>
                                    </div>

                                    {vacancyCandidateApplications.filter(
    (application) =>
        application.shortlisted_by_hiring_manager === true ||
        application.shortlisted_by_hiring_manager === 1
).length === 0 ? (
                                        <div className="empty-vacancy-card">
                                            <h2>
                                                No candidates yet
                                            </h2>

                                            <p>
                                                Candidates further
                                                shortlisted by the
                                                Hiring Manager will
                                                appear here.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="candidate-list">
                                            {vacancyCandidateApplications
    .filter(
        (application) =>
            application.shortlisted_by_hiring_manager === true ||
            application.shortlisted_by_hiring_manager === 1
    )
                                                .map((application, index) =>
                                                    renderCandidateColumn(
                                                        application,
                                                        index
                                                    )
                                                )}
                                        </div>
                                    )}

                                   {/* =================================================
    PRIMARY SHORTLISTED CANDIDATES
================================================= */}

<div className="candidate-section-heading">
    <div>
        <p className="page-eyebrow">
            PRIMARY SHORTLISTED CANDIDATES
        </p>
    </div>
</div>

{vacancyCandidateApplications.filter(
    (application) =>
        Number(application.match_score ?? 0) >= 60 &&
        application.status !== "hiring_manager_shortlisted" &&
        application.status !== "rejected"
).slice(0, 5).length === 0 ? (
    <div className="empty-vacancy-card">
        <h2>
            No shortlisted candidates
        </h2>

        <p>
            Candidates selected for the primary
            shortlist will appear here.
        </p>
    </div>
) : (
    <div className="candidate-list">
        {vacancyCandidateApplications
            .filter(
                (application) =>
                    Number(application.match_score ?? 0) >= 60 &&
                    application.status !== "hiring_manager_shortlisted" &&
                    application.status !== "rejected"
            )
            .sort(
                (a, b) =>
                    Number(b.match_score ?? 0) -
                    Number(a.match_score ?? 0)
            )
            .slice(0, 5)
            .map(
                (application, index) =>
                    renderCandidateColumn(
                        application,
                        index
                    )
            )}
    </div>
)}


                                    {/* =================================================
                                        ALL CANDIDATES
                                        (everyone not already shown above)
                                    ================================================= */}

                                    <div className="candidate-section-heading">
    <div>
        <p className="page-eyebrow">
            APPLICATIONS
        </p>

        <h2>
            All Candidates
        </h2>
    </div>

    <div
        style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
        }}
    >
        <label
            style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
            }}
        >
            <input
                type="checkbox"
                checked={
                    vacancyCandidateApplications.filter(
                        (application) =>
                            application.status !==
                                "shortlisted" &&
                            application.status !==
                                "hiring_manager_shortlisted" &&
                            application.status !==
                                "rejected"
                    ).length > 0 &&
                    vacancyCandidateApplications
                        .filter(
                            (application) =>
                                application.status !==
                                    "shortlisted" &&
                                application.status !==
                                    "hiring_manager_shortlisted" &&
                                application.status !==
                                    "rejected"
                        )
                        .every((application) =>
                            selectedCandidateIds.includes(
                                application.id
                            )
                        )
                }
                onChange={(e) => {
                    const selectableCandidates =
                        vacancyCandidateApplications.filter(
                            (application) =>
                                application.status !==
                                    "shortlisted" &&
                                application.status !==
                                    "hiring_manager_shortlisted" &&
                                application.status !==
                                    "rejected"
                        );

                    if (e.target.checked) {
                        setSelectedCandidateIds(
                            selectableCandidates.map(
                                (application) =>
                                    application.id
                            )
                        );
                    } else {
                        setSelectedCandidateIds([]);
                    }
                }}
            />

            Select All
        </label>

        {selectedCandidateIds.length > 0 && (
            <button
                type="button"
                onClick={
                    handleRejectSelectedCandidates
                }
                disabled={statusUpdating}
            >
                {statusUpdating
                    ? "Rejecting..."
                    : `Reject Selected (${selectedCandidateIds.length})`}
            </button>
        )}
    </div>
</div>
                                   {vacancyCandidateApplications.filter(
    (application) =>
        application.status !== "shortlisted" &&
        application.shortlisted_by_hiring_manager !== true &&
        application.shortlisted_by_hiring_manager !== 1
).length === 0 ? (
                                        <div className="empty-vacancy-card">
                                            <h2>
                                                No other
                                                candidates
                                            </h2>

                                            <p>
                                                All current
                                                candidates
                                                are already
                                                shown above.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="candidate-list">
    {vacancyCandidateApplications
        .filter(
            (application) =>
                application.status !== "shortlisted" &&
                application.shortlisted_by_hiring_manager !== true &&
                application.shortlisted_by_hiring_manager !== 1
        )
       .map(
    (
        application,
        index
    ) => (
        <div
            key={application.id}
        >
            {application.status !==
                "rejected" && (
                <label
                    style={{
                        display: "flex",
                        alignItems:
                            "center",
                        gap: "6px",
                        marginBottom:
                            "6px",
                        cursor: "pointer",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={selectedCandidateIds.includes(
                            application.id
                        )}
                        onChange={(e) => {
                            if (
                                e.target
                                    .checked
                            ) {
                                setSelectedCandidateIds(
                                    (
                                        current
                                    ) => [
                                        ...current,
                                        application.id,
                                    ]
                                );
                            } else {
                                setSelectedCandidateIds(
                                    (
                                        current
                                    ) =>
                                        current.filter(
                                            (
                                                id
                                            ) =>
                                                id !==
                                                application.id
                                        )
                                );
                            }
                        }}
                    />

                    Select for rejection
                </label>
            )}

            {renderCandidateColumn(
                application,
                index
            )}
        </div>
    )
)}
                                        </div>
                                    )}
                                </>
                            )}

                            
                        </section>
                        
                    )}


                {/* =================================================
                    INBOX
                ================================================= */}

                {activeSection ===
                    "inbox" && (
                    <section className="dashboard-section">
                        <div className="page-header">
                            <div>
                                <p className="page-eyebrow">
                                    HOME
                                </p>

                                <h1>
                                    Inbox
                                </h1>

                                <p className="page-description">
                                    Recruitment
                                    messages and
                                    notifications
                                    will appear
                                    here.
                                </p>
                            </div>
                        </div>

                        <div className="empty-vacancy-card">
                            <h2>
                                Inbox
                            </h2>

                            <p>
                                No new messages.
                            </p>
                        </div>
                    </section>
                )}
{/* =================================================
    INTERVIEW
================================================= */}

{activeSection === "interview" && (
    <section className="dashboard-section interview-page">

        <div className="interview-page-header">
            <div>
                <p className="page-eyebrow">
                    RECRUITMENT
                </p>

                <h2>
                    Interviews
                </h2>

                <p>
                    Manage candidate interviews and interviewer availability.
                </p>
            </div>
        </div>


        {/* =====================================================
            INTERVIEW 1
        ====================================================== */}

        <div className="interview-block">

            <div className="interview-block-header">
                <div>
                    <h3>
                        Interview 1
                    </h3>

                    <p>
                        Candidates shortlisted by the Hiring Manager
                    </p>
                </div>
            </div>


            {/* Candidate table */}

            <div className="interview-table">

                <div className="interview-table-row interview-table-head">
                    <div>
                        Candidate
                    </div>

                    <div>
                        Score
                    </div>

                    <div>
                        shedule interview 1
                    </div>

                    <div>
                        move to interview 2
                    </div>
                </div>


                {interviewOneCandidates.length === 0 ? (

                    <div className="interview-empty-row">
                        No candidates have been shortlisted by the Hiring Manager.
                    </div>

                ) : (

                    interviewOneCandidates.map(
                        (application) => {

                            const candidate =
                                application.candidate?.user;

                            const candidateName =
                                candidate?.name ||
                                candidate?.full_name ||
                                "Unknown Candidate";

                            const alreadyMoved =
                                application.moved_to_interview_two;

                            return (
                                <div
                                    className="interview-table-row"
                                    key={
                                        application.id
                                    }
                                >

                                    <div className="candidate-name-cell">
                                        {candidateName}
                                    </div>


                                    <div>
                                        {Number(
                                            application.match_score ||
                                                0
                                        ).toFixed(1)}
                                        %
                                    </div>


                                   <button
    type="button"
    className="interview-link-button"
    onClick={() => {
        setSelectedInterviewProfileCandidate(
            application
        );

        setSelectedInterviewProfileNumber(1);

        setInterviewProfileStatus("interview");
    }}
>
    Profile
</button>


                                    <div>

                                        


                                        {alreadyMoved ? (

    <span className="interview-moved-status">
        ✓ Moved to Interview 2
    </span>

) : (

    <button
        type="button"
        className="interview-select-button"
        onClick={async () => {
            const confirmed = window.confirm(
                `Are you sure you want to move ${
                    application.candidate?.user?.name ||
                    "this candidate"
                } to Interview 2?`
            );

            if (!confirmed) {
                return;
            }

            await handleMoveToInterviewTwo(
                application.id
            );
        }}
    >
        Move to Interview 2
    </button>

)}

                                        

                                    </div>

                                </div>
                            );
                        }
                    )

                )}

            </div>


            {interviewMessage && (
                <div className="interview-confirmation">
                    {interviewMessage}
                </div>
            )}


            {/* =================================================
                INTERVIEW 1 SCHEDULING
            ================================================= */}

            <div className="interview-scheduling">

                <h4>
                    Interview 1 Scheduling
                </h4>


                


               <div className="interview-date-field">
    <label>
        Interview Date
    </label>

    <input
        type="date"
        value={interviewOneDate}
        min={new Date()
            .toISOString()
            .split("T")[0]}
        onChange={(e) => {
            const date = e.target.value;

            setInterviewOneDate(date);

setInterviewOneTime("");

setSelectedTechLead(null);
setSelectedSeniorEngineer(null);

            setInterviewMessage("");

           
        }}
    />
</div>

<div className="interview-date-field">
    <label>
        Interview Start Time
    </label>

    <select
        value={interviewOneTime}
        onChange={(e) =>
            setInterviewOneTime(e.target.value)
        }
    >
        <option value="">
            Select start time
        </option>

        <option value="09:00">
            9:00 AM
        </option>

        <option value="10:00">
            10:00 AM
        </option>

        <option value="11:00">
            11:00 AM
        </option>

        <option value="12:00">
            12:00 PM
        </option>

        <option value="13:00">
            1:00 PM
        </option>

        <option value="14:00">
            2:00 PM
        </option>

        <option value="15:00">
            3:00 PM
        </option>
    </select>
</div>


                {interviewOneDate && (
                    <div className="interviewer-availability">

                        <div className="availability-title">
                            Individual Staff Calendar Availability
                        </div>


                        {availabilityLoading ? (

                            <div className="interviewer-unavailable">
                                Checking Google Calendar availability...
                            </div>

                        ) : (

                            <>


                                {/* =================================================
                                    TECH LEADS
                                ================================================= */}

                                <div className="interviewer-group">

                                    <div className="interviewer-role">
                                        Tech Lead
                                    </div>


                                    {getInterviewersByPosition(
                                        "Tech Lead"
                                    ).length === 0 ? (

                                        <div className="interviewer-unavailable">
                                            No Tech Lead accounts have been created.
                                        </div>

                                    ) : (

                                        getInterviewersByPosition(
                                            "Tech Lead"
                                        ).map(
                                            (interviewer) => {

                                                const availability =
                                                    getAvailabilityInfo(
                                                        interviewer,
                                                        1
                                                    );

                                                const available =
                                                    isStaffAvailable(
                                                        interviewer,
                                                        1
                                                    );

                                                return (
                                                    <div
                                                        className={`interviewer-row ${
                                                            selectedTechLead?.id ===
                                                            interviewer.id
                                                                ? "selected"
                                                                : ""
                                                        }`}
                                                        key={
                                                            interviewer.id
                                                        }
                                                    >

                                                        <div className="interviewer-info">

                                                            <strong>
                                                                {
                                                                    interviewer.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    interviewer.email
                                                                }
                                                            </span>

                                                        </div>


                                                        <div className="interviewer-actions">

                                                            {available ? (

                                                                <span className="available-label">
                                                                    ✓ Available
                                                                </span>

                                                            ) : (

                                                                <span className="interviewer-unavailable">
                                                                    {availability?.connected === false
                                                                        ? "Calendar not connected"
                                                                        : "Unavailable"}
                                                                </span>

                                                            )}


                                                            <button
                                                                type="button"
                                                                className="interview-profile-button"
                                                                onClick={() =>
                                                                    handleInterviewerProfile(
                                                                        interviewer
                                                                    )
                                                                }
                                                            >
                                                                View Profile
                                                            </button>


                                                            {available && (
                                                                <button
                                                                    type="button"
                                                                    className="interview-choose-button"
                                                                    onClick={() =>
                                                                        setSelectedTechLead(
                                                                            interviewer
                                                                        )
                                                                    }
                                                                >
                                                                    {selectedTechLead?.id ===
                                                                    interviewer.id
                                                                        ? "Selected"
                                                                        : "Choose"}
                                                                </button>
                                                            )}

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )

                                    )}

                                </div>


                                {/* =================================================
                                    SENIOR SOFTWARE ENGINEERS
                                ================================================= */}

                                <div className="interviewer-group">

                                    <div className="interviewer-role">
                                        Senior Software Engineer
                                    </div>


                                    {getInterviewersByPosition(
                                        "Senior Software Engineer"
                                    ).length === 0 ? (

                                        <div className="interviewer-unavailable">
                                            No Senior Software Engineer accounts have been created.
                                        </div>

                                    ) : (

                                        getInterviewersByPosition(
                                            "Senior Software Engineer"
                                        ).map(
                                            (interviewer) => {

                                                const availability =
                                                    getAvailabilityInfo(
                                                        interviewer,
                                                        1
                                                    );

                                                const available =
                                                    isStaffAvailable(
                                                        interviewer,
                                                        1
                                                    );

                                                return (
                                                    <div
                                                        className={`interviewer-row ${
                                                            selectedSeniorEngineer?.id ===
                                                            interviewer.id
                                                                ? "selected"
                                                                : ""
                                                        }`}
                                                        key={
                                                            interviewer.id
                                                        }
                                                    >

                                                        <div className="interviewer-info">

                                                            <strong>
                                                                {
                                                                    interviewer.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    interviewer.email
                                                                }
                                                            </span>

                                                        </div>


                                                        <div className="interviewer-actions">

                                                            {available ? (

                                                                <span className="available-label">
                                                                    ✓ Available
                                                                </span>

                                                            ) : (

                                                                <span className="interviewer-unavailable">
                                                                    {availability?.connected === false
                                                                        ? "Calendar not connected"
                                                                        : "Unavailable"}
                                                                </span>

                                                            )}


                                                            <button
                                                                type="button"
                                                                className="interview-profile-button"
                                                                onClick={() =>
                                                                    handleInterviewerProfile(
                                                                        interviewer
                                                                    )
                                                                }
                                                            >
                                                                View Profile
                                                            </button>


                                                            {available && (
                                                                <button
                                                                    type="button"
                                                                    className="interview-choose-button"
                                                                    onClick={() =>
                                                                        setSelectedSeniorEngineer(
                                                                            interviewer
                                                                        )
                                                                    }
                                                                >
                                                                    {selectedSeniorEngineer?.id ===
                                                                    interviewer.id
                                                                        ? "Selected"
                                                                        : "Choose"}
                                                                </button>
                                                            )}

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )

                                    )}

                                </div>
{selectedTechLead &&
    selectedSeniorEngineer &&
    interviewOneDate &&
    interviewOneTime && (
        <button
    type="button"
    className="interview-schedule-button"
    disabled={schedulingInterview}
    onClick={() => handleScheduleInterview(1)}
>
    {schedulingInterview
        ? "Scheduling..."
        : "Schedule Interview 1"}
</button>
    )}


                            </>

                        )}

                    </div>
                )}

            </div>

        </div>


        {/* =====================================================
            INTERVIEW 2
        ====================================================== */}

        <div className="interview-block">

            <div className="interview-block-header">

                <div>
                    <h3>
                        Interview 2
                    </h3>

                    <p>
                        Candidates selected from Interview 1
                    </p>
                </div>

            </div>


            {/* Candidate table */}

<div className="interview-table">

    <div className="interview-table-row interview-table-head interview-two-head">

        <div>
            Candidate
        </div>

        <div>
            Score
        </div>

        <div>
            Profile
        </div>

        <div>
            Select for Position
        </div>

    </div>


    {interviewTwoCandidates.length === 0 ? (

        <div className="interview-empty-row">
            No candidates have been moved to Interview 2.
        </div>

    ) : (

        interviewTwoCandidates.map((application) => {

            const candidate =
                application.candidate?.user;

            const candidateName =
                candidate?.name ||
                candidate?.full_name ||
                "Unknown Candidate";

            const selected =
                application.status === "selected";

            return (
                <div
                    className={`interview-table-row interview-two-row ${
                        selected ? "selected" : ""
                    }`}
                    key={application.id}
                >

                    <div className="candidate-name-cell">
                        {candidateName}
                    </div>


                    <div>
                        {Number(
                            application.match_score || 0
                        ).toFixed(1)}
                        %
                    </div>


                    <button
                        type="button"
                        className="interview-link-button"
                        onClick={() => {
                            setSelectedInterviewProfileCandidate(
                                application
                            );

                            setSelectedInterviewProfileNumber(2);

                            setInterviewProfileStatus("interview");
                        }}
                    >
                        Profile
                    </button>


                   <div>
    <button
  type="button"
  className="interview-select-button"
  disabled={application.status === "selected"}
  onClick={async () => {
    const candidateName =
      application.candidate?.user?.name ||
      application.candidate?.user?.full_name ||
      "this candidate";

    const positionName =
      application.jobPosition?.title ||
      application.job_position?.title ||
      "this position";

    const confirmed = window.confirm(
      `Are you sure you want to select ${candidateName} for the ${positionName} position?`
    );

    if (!confirmed) {
      return;
    }

    await handleStatusChange(application.id, "selected");
  }}
>
  {application.status === "selected"
    ? "Selected"
    : "Select for Position"}
</button>
</div>

                </div>
            );
        })

    )}

</div>


{/* Persistent selection message */}

{interviewTwoCandidates.some(
    (application) =>
        application.status === "selected"
) && (
    <div className="interview-selection-messages">

        {interviewTwoCandidates
            .filter(
                (application) =>
                    application.status === "selected"
            )
            .map((application) => {

                const candidateName =
                    application.candidate?.user?.name ||
                    application.candidate?.user?.full_name ||
                    "Candidate";

                const positionName =
                    application.jobPosition?.title ||
                    application.job_position?.title ||
                    "Position";

                return (
                    <div
                        key={application.id}
                        className="selection-success-message"
                    >
                        ✓ {candidateName} has been selected
                        for the {positionName} position.
                    </div>
                );
            })}

    </div>
)}


            {/* =================================================
                INTERVIEW 2 SCHEDULING
            ================================================= */}

            {interviewTwoCandidates.length > 0 && (
                <div className="interview-scheduling">

                    <h4>
                        Interview 2 Scheduling
                    </h4>


                   


                    <div className="interview-date-field">

                        <label>
                            Interview Date
                        </label>

                        <input
                            type="date"
                            value={
                                interviewTwoDate
                            }
                            min={
                                new Date()
                                    .toISOString()
                                    .split("T")[0]
                            }
                            onChange={(e) => {

                                const date =
                                    e.target.value;

                                setInterviewTwoDate(date);

setInterviewTwoTime("");

setSelectedHRManager(null);
setSelectedHiringManager(null);

                                setInterviewMessage("");

                               
                            }}
                        />

                    </div>
<div className="interview-date-field">
    <label>
        Interview Start Time
    </label>

    <select
        value={interviewTwoTime}
        onChange={(e) =>
            setInterviewTwoTime(e.target.value)
        }
    >
        <option value="">
            Select start time
        </option>

        <option value="09:00">
            9:00 AM
        </option>

        <option value="10:00">
            10:00 AM
        </option>

        <option value="11:00">
            11:00 AM
        </option>

        <option value="12:00">
            12:00 PM
        </option>

        <option value="13:00">
            1:00 PM
        </option>

        <option value="14:00">
            2:00 PM
        </option>

        <option value="15:00">
            3:00 PM
        </option>
    </select>
</div>

                    {interviewTwoDate && (
                        <div className="interviewer-availability">

                            <div className="availability-title">
                                Individual Staff Calendar Availability
                            </div>


                            {availabilityLoading ? (

                                <div className="interviewer-unavailable">
                                    Checking Google Calendar availability...
                                </div>

                            ) : (

                                <>


                                    {/* =================================================
                                        HR MANAGER
                                    ================================================= */}

                                    <div className="interviewer-group">

                                        <div className="interviewer-role">
                                            HR Manager
                                        </div>


                                        {getInterviewersByPosition(
                                            "HR Manager"
                                        ).map(
                                            (interviewer) => {

                                                const availability =
                                                    getAvailabilityInfo(
                                                        interviewer,
                                                        2
                                                    );

                                                const available =
                                                    isStaffAvailable(
                                                        interviewer,
                                                        2
                                                    );

                                                return (
                                                    <div
                                                        className={`interviewer-row ${
                                                            selectedHRManager?.id ===
                                                            interviewer.id
                                                                ? "selected"
                                                                : ""
                                                        }`}
                                                        key={
                                                            interviewer.id
                                                        }
                                                    >

                                                        <div className="interviewer-info">

                                                            <strong>
                                                                {
                                                                    interviewer.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    interviewer.email
                                                                }
                                                            </span>

                                                        </div>


                                                        <div className="interviewer-actions">

                                                            {available ? (

                                                                <span className="available-label">
                                                                    ✓ Available
                                                                </span>

                                                            ) : (

                                                                <span className="interviewer-unavailable">
                                                                    {availability?.connected === false
                                                                        ? "Calendar not connected"
                                                                        : "Unavailable"}
                                                                </span>

                                                            )}


                                                            <button
                                                                type="button"
                                                                className="interview-profile-button"
                                                                onClick={() =>
                                                                    handleInterviewerProfile(
                                                                        interviewer
                                                                    )
                                                                }
                                                            >
                                                                View Profile
                                                            </button>


                                                            {available && (
                                                                <button
                                                                    type="button"
                                                                    className="interview-choose-button"
                                                                    onClick={() =>
                                                                        setSelectedHRManager(
                                                                            interviewer
                                                                        )
                                                                    }
                                                                >
                                                                    {selectedHRManager?.id ===
                                                                    interviewer.id
                                                                        ? "Selected"
                                                                        : "Choose"}
                                                                </button>
                                                            )}

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )}

                                    </div>


                                    {/* =================================================
                                        HIRING MANAGER
                                    ================================================= */}

                                    <div className="interviewer-group">

                                        <div className="interviewer-role">
                                            Hiring Manager
                                        </div>


                                        {getInterviewersByPosition(
                                            "Hiring Manager"
                                        ).map(
                                            (interviewer) => {

                                                const availability =
                                                    getAvailabilityInfo(
                                                        interviewer,
                                                        2
                                                    );

                                                const available =
                                                    isStaffAvailable(
                                                        interviewer,
                                                        2
                                                    );

                                                return (
                                                    <div
                                                        className={`interviewer-row ${
                                                            selectedHiringManager?.id ===
                                                            interviewer.id
                                                                ? "selected"
                                                                : ""
                                                        }`}
                                                        key={
                                                            interviewer.id
                                                        }
                                                    >

                                                        <div className="interviewer-info">

                                                            <strong>
                                                                {
                                                                    interviewer.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    interviewer.email
                                                                }
                                                            </span>

                                                        </div>


                                                        <div className="interviewer-actions">

                                                            {available ? (

                                                                <span className="available-label">
                                                                    ✓ Available
                                                                </span>

                                                            ) : (

                                                                <span className="interviewer-unavailable">
                                                                    {availability?.connected === false
                                                                        ? "Calendar not connected"
                                                                        : "Unavailable"}
                                                                </span>

                                                            )}


                                                            <button
                                                                type="button"
                                                                className="interview-profile-button"
                                                                onClick={() =>
                                                                    handleInterviewerProfile(
                                                                        interviewer
                                                                    )
                                                                }
                                                            >
                                                                View Profile
                                                            </button>


                                                            {available && (
                                                                <button
                                                                    type="button"
                                                                    className="interview-choose-button"
                                                                    onClick={() =>
                                                                        setSelectedHiringManager(
                                                                            interviewer
                                                                        )
                                                                    }
                                                                >
                                                                    {selectedHiringManager?.id ===
                                                                    interviewer.id
                                                                        ? "Selected"
                                                                        : "Choose"}
                                                                </button>
                                                            )}

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )}

                                    </div>


                                    {selectedHRManager &&
    selectedHiringManager && (
        <button
            type="button"
            className="interview-schedule-button"
            disabled={schedulingInterview}
            onClick={() =>
                handleScheduleInterview(2)
            }
        >
            {schedulingInterview
                ? "Assigning..."
                : "Assign & Schedule Interview 2"}
        </button>
    )}

                                </>

                            )}

                        </div>
                    )}

                </div>
            )}

        </div>


        {/* =====================================================
            INTERVIEWER PROFILE
        ====================================================== */}

        {selectedInterviewerProfile && (
            <div className="interviewer-profile-overlay">

                <div className="interviewer-profile-modal">

                    <button
                        type="button"
                        className="interviewer-profile-close"
                        onClick={() =>
                            setSelectedInterviewerProfile(
                                null
                            )
                        }
                    >
                        ×
                    </button>


                    <div className="interviewer-profile-header">

                        <div className="interviewer-avatar">
                            {(
                                selectedInterviewerProfile.name ||
                                "S"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>


                        <div>

                            <h3>
                                {
                                    selectedInterviewerProfile.name
                                }
                            </h3>

                            <p>
                                {getInterviewerPosition(
                                    selectedInterviewerProfile
                                )}
                            </p>

                        </div>

                    </div>


                    <div className="interviewer-profile-details">

                        <div className="profile-detail-row">

                            <span>
                                Email
                            </span>

                            <strong>
                                {
                                    selectedInterviewerProfile.email ||
                                    "Not available"
                                }
                            </strong>

                        </div>


                        <div className="profile-detail-row">

                            <span>
                                Role
                            </span>

                            <strong>
                                {
                                    selectedInterviewerProfile.role?.name ||
                                    "Staff"
                                }
                            </strong>

                        </div>


                        <div className="profile-detail-row">

                            <span>
                                Position
                            </span>

                            <strong>
                                {getInterviewerPosition(
                                    selectedInterviewerProfile
                                )}
                            </strong>

                        </div>


                        <div className="profile-detail-row">

                            <span>
                                Google Calendar
                            </span>

                            <strong>
                                {
                                    selectedInterviewerProfile.calendar_connected
                                        ? "Connected"
                                        : "Not connected"
                                }
                            </strong>

                        </div>


                        <div className="profile-detail-row">

                            <span>
                                Contact
                            </span>

                            {selectedInterviewerProfile.email ? (
                                <a
                                    href={`mailto:${selectedInterviewerProfile.email}`}
                                    className="interview-link-button"
                                >
                                    Email Staff Member
                                </a>
                            ) : (
                                <strong>
                                    Not available
                                </strong>
                            )}

                        </div>

                    </div>

                </div>

            </div>
        )}

    </section>
)}

{/* =================================================
    MY FEEDBACKS
================================================= */}

{activeSection === "my-feedbacks" && (
    <section className="dashboard-section">

        <div className="page-header">

            <div>
                <p className="page-eyebrow">
                    INTERVIEW
                </p>

                <h1>
                    My Feedbacks
                </h1>

                <p className="page-description">
                    Review the interview feedback
                    you have submitted and update
                    your own assessments.
                </p>
            </div>

        </div>

        {myFeedbacksLoading ? (
            <div className="loading-message">
                Loading your feedback...
            </div>
        ) : myFeedbacks.length === 0 ? (
            <div className="empty-vacancy-card">

                <h2>
                    No Feedback Yet
                </h2>

                <p>
                    Feedback you submit during
                    interviews will appear here.
                </p>

            </div>
        ) : (
            <div className="my-feedback-list">

                {myFeedbacks.map((feedbackItem) => {

    const interview =
        feedbackItem.interview;

    const application =
        interview?.application;

    const candidateName =
        application
            ?.candidate
            ?.user
            ?.name ||
        application
            ?.candidate
            ?.name ||
        "Unknown Candidate";

    const vacancyTitle =
        application
            ?.jobPosition
            ?.title ||
        application
            ?.job_position
            ?.title ||
        "Untitled Vacancy";

    const hasFeedback =
        Boolean(
            feedbackItem.feedback &&
            feedbackItem.feedback.trim()
        );


        
    return (
        <div
            className="my-feedback-card"
            key={feedbackItem.id}
        >

            <div className="my-feedback-header">

                <div className="my-feedback-avatar">
                    {candidateName
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <div>

                    <h3>
                        {candidateName}
                    </h3>

                    <p>
                        Interview 2 ·{" "}
                        {vacancyTitle}
                    </p>

                </div>

            </div>

            <div className="my-feedback-date">

                {interview?.scheduled_date
                    ? new Date(
                        interview.scheduled_date
                    ).toLocaleDateString()
                    : "Date not available"}

            </div>

            <div className="my-feedback-content">

                <span>
                    {hasFeedback
                        ? "MY FEEDBACK"
                        : "FEEDBACK REQUIRED"}
                </span>

                <p>
                    {hasFeedback
                        ? feedbackItem.feedback
                        : "No feedback submitted yet. Open the candidate profile to submit your Interview 2 assessment."}
                </p>

            </div>

            <div className="my-feedback-actions">

                <button
                    type="button"
                    className="interview-link-button"
                    onClick={() =>
                        openInterviewProfile(
                            application,
                            2,
                            interview
                        )
                    }
                >
                    {hasFeedback
                        ? "View Feedback"
                        : "Give Feedback"}
                </button>

            </div>

        </div>
    );
})}

            </div>
        )}

    </section>
)}

                {/* =================================================
                    CREATE VACANCY MODAL
                ================================================= */}

                {showCreateVacancy && (
                    <div className="modal-overlay">
                        <div className="vacancy-modal">
                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowCreateVacancy(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                            <p className="modal-eyebrow">
                                RECRUITMENT
                            </p>

                            <h2>
                                Create a vacancy
                            </h2>

                            <p className="modal-description">
                                Add a new position
                                that your hiring
                                team can recruit
                                candidates for.
                            </p>

                            <form
                                onSubmit={
                                    handleCreateVacancy
                                }
                            >
                                <div className="form-group">
                                    <label>
                                        Position
                                        title
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. Software Engineer"
                                        value={
                                            newVacancy.title
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewVacancy(
                                                {
                                                    ...newVacancy,
                                                    title:
                                                        e
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Department
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="e.g. Human Resources"
                                        value={
                                            newVacancy.department
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewVacancy(
                                                {
                                                    ...newVacancy,
                                                    department:
                                                        e
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Job
                                        description
                                    </label>

                                    <textarea
                                        placeholder="Briefly describe the position"
                                        value={
                                            newVacancy.description
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewVacancy(
                                                {
                                                    ...newVacancy,
                                                    description:
                                                        e
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Responsibilities
                                    </label>

                                    <textarea
                                        placeholder="Main responsibilities"
                                        value={
                                            newVacancy.responsibilities
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewVacancy(
                                                {
                                                    ...newVacancy,
                                                    responsibilities:
                                                        e
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Minimum
                                        experience
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        value={
                                            newVacancy.minimum_experience
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewVacancy(
                                                {
                                                    ...newVacancy,
                                                    minimum_experience:
                                                        e
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Employment
                                        type
                                    </label>

                                    <select
                                        value={
                                            newVacancy.employment_type
                                        }
                                        onChange={(
                                            e
                                        ) =>
                                            setNewVacancy(
                                                {
                                                    ...newVacancy,
                                                    employment_type:
                                                        e
                                                            .target
                                                            .value,
                                                }
                                            )
                                        }
                                    >
                                        <option>
                                            Full time
                                        </option>

                                        <option>
                                            Part time
                                        </option>

                                        <option>
                                            Internship
                                        </option>

                                        <option>
                                            Contract
                                        </option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="modal-create-button"
                                >
                                    Create Vacancy
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* =================================================
                    CANDIDATE DETAIL MODAL
                ================================================= */}

                {selectedCandidate &&
                    !selectedCandidate.primaryShortlist && (
                        <CandidateDetailModal
                            selectedCandidate={
                                selectedCandidate
                            }
                            setSelectedCandidate={
                                setSelectedCandidate
                            }
                            showExtractedText={
                                showExtractedText
                            }
                            setShowExtractedText={
                                setShowExtractedText
                            }
                            getCvStats={
                                getCvStats
                            }
                            getMatchScore={
                                getMatchScore
                            }
                            getMatchCategory={
                                getMatchCategory
                            }
                            handleStatusChange={
                                handleStatusChange
                            }
                            statusUpdating={
                                statusUpdating
                            }
                            handleViewCv={
                                handleViewCv
                            }
                        />
                    )}

                    {/* =================================================
    INTERVIEW CANDIDATE PROFILE
================================================= */}

{selectedInterviewProfileCandidate && (
    <div className="interview-profile-overlay">

        <div className="interview-profile-modal">

            <div className="interview-profile-header">

                <div>
                    <h2>
                        {
                            selectedInterviewProfileCandidate
                                .candidate?.user?.name ||
                            selectedInterviewProfileCandidate
                                .candidate?.user?.full_name ||
                            "Unknown Candidate"
                        }
                    </h2>

                    <p>
                        Interview{" "}
                        {selectedInterviewProfileNumber}
                    </p>
                </div>

                <button
                    type="button"
                    className="interview-profile-close"
                    onClick={() =>
                        setSelectedInterviewProfileCandidate(
                            null
                        )
                    }
                >
                    ×
                </button>

            </div>


            <div className="interview-profile-details">

                {/* NAME */}

                <div className="interview-profile-field">

                    <label>
                        Name
                    </label>

                    <div className="interview-profile-value">
                        {
                            selectedInterviewProfileCandidate
                                .candidate?.user?.name ||
                            selectedInterviewProfileCandidate
                                .candidate?.user?.full_name ||
                            "Unknown Candidate"
                        }
                    </div>

                </div>


                {/* STATUS */}

                <div className="interview-profile-field">

                    <label>
                        Status
                    </label>

                    <select
                        value={
                            interviewProfileStatus
                        }
                        onChange={(e) =>
                            setInterviewProfileStatus(
                                e.target.value
                            )
                        }
                    >
                        <option value="rejected">
                            Rejected
                        </option>

                        <option value="interview">
                            Interview
                        </option>

                        <option value="selected">
                            Selected
                        </option>
                    </select>

                </div>


                {/* INTERVIEW DATE */}

                <div className="interview-profile-field">

                    <label>
                        Interview Date
                    </label>

                    <input
                        type="date"
                        value={
                            selectedInterviewProfileNumber === 1
                                ? interviewOneDate
                                : interviewTwoDate
                        }
                        min={
                            new Date()
                                .toISOString()
                                .split("T")[0]
                        }
                        onChange={(e) => {

                            const date =
                                e.target.value;

                            if (
                                selectedInterviewProfileNumber ===
                                1
                            ) {
                                setInterviewOneDate(
                                    date
                                );
                            } else {
                                setInterviewTwoDate(
                                    date
                                );
                            }

                        }}
                    />

                </div>


                {/* EMAIL */}

                <div className="interview-profile-field">

                    <label>
                        Email
                    </label>

                    <button
                        type="button"
                        className="interview-email-button"
                        onClick={() => {

                            const email =
                                selectedInterviewProfileCandidate
                                    .candidate?.user?.email ||
                                selectedInterviewProfileCandidate
                                    .candidate?.email;

                            if (email) {
                                window.location.href =
                                    `mailto:${email}`;
                            }

                        }}
                    >
                        {
                            selectedInterviewProfileCandidate
                                .candidate?.user?.email ||
                            selectedInterviewProfileCandidate
                                .candidate?.email ||
                            "No email available"
                        }
                    </button>

                </div>

            </div>

                                        
      {showCandidateFeedback && (
    <div className="candidate-feedback-overlay">

        <div className="candidate-feedback-popup">

            {/* HEADER */}
            <div className="candidate-feedback-popup-header">

                <div>
                    <p className="candidate-feedback-eyebrow">
                        INTERVIEW ASSESSMENTS
                    </p>

                    <h2>
                        Interview Feedback
                    </h2>

                    <p className="candidate-feedback-candidate-name">
                        {selectedInterviewProfileCandidate
                            ?.candidate
                            ?.user
                            ?.name ||
                        selectedInterviewProfileCandidate
                            ?.candidate
                            ?.name ||
                        "Candidate"}
                    </p>
                </div>

                <button
                    type="button"
                    className="candidate-feedback-close-button"
                    onClick={() =>
                        setShowCandidateFeedback(false)
                    }
                    aria-label="Close feedback"
                >
                    ×
                </button>

            </div>


            {/* BODY */}
            <div className="candidate-feedback-popup-body">

                {candidateFeedbackLoading ? (

                    <div className="candidate-feedback-state">
                        Loading interview feedback...
                    </div>

                ) : candidateFeedbackError ? (

                    <div className="candidate-feedback-error">
                        {candidateFeedbackError}
                    </div>

                ) : candidateFeedbacks.length === 0 ? (

                    <div className="candidate-feedback-state">
                        <div className="candidate-feedback-empty-icon">
                            💬
                        </div>

                        <h3>
                            No feedback yet
                        </h3>

                        <p>
                            Interview feedback submitted by
                            participants will appear here.
                        </p>
                    </div>

                ) : (

                    [1, 2].map((interviewNumber) => {

    const interviewFeedback =
        candidateFeedbacks.filter(
            (item) =>
                Number(item.interview_number) ===
                interviewNumber
        );

    return (
        <div
            className="candidate-feedback-stage"
            key={interviewNumber}
        >

            <div className="candidate-feedback-stage-heading">
                <span>
                    INTERVIEW {interviewNumber}
                </span>
            </div>

            {interviewFeedback.length === 0 ? (

                <div className="candidate-feedback-no-entry">
                    No feedback submitted yet.
                </div>

            ) : (

                interviewFeedback.map((item) => (

                    <div
                        className="candidate-feedback-card"
                        key={item.id}
                    >

                        <div className="candidate-feedback-card-header">

                            <div>
                                <h3>
                                    {item.interviewer?.name ||
                                        "Interview Participant"}
                                </h3>

                                <span>
                                    {item.interviewer?.position ||
                                        "Staff"}
                                </span>
                            </div>

                            {item.created_at && (
                                <time>
                                    {new Date(
                                        item.created_at
                                    ).toLocaleDateString()}
                                </time>
                            )}

                        </div>

                        <div className="candidate-feedback-text">
                            {item.feedback}
                        </div>

                    </div>

                ))

            )}

            {/* ==========================================
                HR FEEDBACK - INTERVIEW 2 ONLY
            ========================================== */}

            {interviewNumber === 2 && (
                <div className="hr-feedback-entry">

                    <div className="hr-feedback-entry-header">
                        <div>
                            <span className="candidate-feedback-eyebrow">
                                HR ASSESSMENT
                            </span>

                            <h3>
                                Your Interview 2 Feedback
                            </h3>
                        </div>
                    </div>

                    {interviewFeedbackLoading ? (

                        <div className="candidate-feedback-state">
                            Loading your feedback...
                        </div>

                    ) : (

                        <>
                            <textarea
                                className="hr-feedback-textarea"
                                value={interviewFeedbackText}
                                onChange={(e) =>
                                    setInterviewFeedbackText(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter your interview feedback..."
                                rows={6}
                                disabled={
                                    interviewFeedbackSubmitting ||
                                    !!existingInterviewFeedback
                                }
                            />

                            {interviewFeedbackError && (
                                <div className="candidate-feedback-error">
                                    {interviewFeedbackError}
                                </div>
                            )}

                            {existingInterviewFeedback ? (

                                <div className="candidate-feedback-submitted">
                                    ✓ Your feedback has already been
                                    submitted for this interview.
                                </div>

                            ) : (

                                <button
                                    type="button"
                                    className="candidate-feedback-submit-button"
                                    onClick={
                                        handleSubmitInterviewFeedback
                                    }
                                    disabled={
                                        interviewFeedbackSubmitting ||
                                        !interviewFeedbackText.trim()
                                    }
                                >
                                    {interviewFeedbackSubmitting
                                        ? "Submitting..."
                                        : "Submit Feedback"}
                                </button>

                            )}
                        </>

                    )}

                </div>
            )}

        </div>
    );
})

                )}

            </div>


            {/* FOOTER */}
            <div className="candidate-feedback-popup-footer">

                <button
                    type="button"
                    className="candidate-feedback-close-footer"
                    onClick={() =>
                        setShowCandidateFeedback(false)
                    }
                >
                    Close
                </button>

            </div>

        </div>

    </div>
)}

           

            {/* ACTIONS */}

            <div className="interview-profile-actions">

                <button
                    type="button"
                    className="interview-profile-action-button"
                    disabled={
                        !selectedInterviewProfileCandidate.cv
                    }
                    onClick={() => {

                        if (
                            selectedInterviewProfileCandidate.cv
                        ) {
                            handleViewCv(
                                selectedInterviewProfileCandidate.cv
                            );
                        }

                    }}
                >
                    View CV
                </button>


                <button
    type="button"
    className="interview-profile-action-button"
    onClick={() => {
        fetchCandidateFeedback(
            selectedInterviewProfileCandidate?.id
        );
        setShowCandidateFeedback(true);
    }}
>
    Feedback
</button>

            </div>


            {/* CONFIRM SCHEDULE */}

            <div className="interview-profile-footer">
<button
    type="button"
    className="interview-schedule-button"
    disabled={schedulingInterview || statusUpdating}
    onClick={async () => {

        const status =
            interviewProfileStatus;

        // Selected or Rejected:
        // update application status only.
        if (
            status === "selected" ||
            status === "rejected"
        ) {
            await handleStatusChange(
                selectedInterviewProfileCandidate.id,
                status
            );

            setSelectedInterviewProfileCandidate(
                null
            );

            return;
        }

        // Interview:
        // use the existing scheduling flow.
        await handleScheduleInterview(
            selectedInterviewProfileNumber
        );
    }}
>
    {schedulingInterview || statusUpdating
        ? "Saving..."
        : "Save"}
</button>
            </div>

        </div>

    </div>
)}

                {/* =================================================
                    PRIMARY SHORTLIST MODAL (Job Postings flow)
                ================================================= */}

                {selectedCandidate?.primaryShortlist && (
                    <div className="modal-overlay">
                        <div className="candidate-modal">
                            <button
                                className="modal-close"
                                onClick={() => {
                                    setSelectedCandidate(
                                        null
                                    );

                                    setExpandedPrimaryCandidateId(
                                        null
                                    );

                                    setPrimaryExtractedTextId(
                                        null
                                    );
                                }}
                            >
                                ×
                            </button>

                            <p className="modal-eyebrow">
                                PRIMARY SHORTLIST
                            </p>

                            <h2>
                                Top 5 Candidates
                            </h2>

                            <p className="modal-description">
                                Candidates with a
                                match score of 60%
                                or higher.
                            </p>

                            <div className="candidate-handoff">
                                <button
    className="send-hiring-manager-button"
    onClick={handleSendToHiringManager}
    disabled={sendingToHiringManager}
>
    {sendingToHiringManager
        ? "Sending..."
        : "Send Top 5 to Hiring Manager"}
</button>

                                <p>
                                    Sends the highest
                                    scoring eligible
                                    candidates for
                                    secondary manual
                                    shortlisting.
                                </p>
                            </div>

                            {candidateLoading ? (
                                <div className="loading-message">
                                    Loading
                                    candidates...
                                </div>
                            ) : selectedCandidate
                                  .applications
                                  .length === 0 ? (
                                <div className="no-candidates">
                                    <h3>
                                        No eligible
                                        candidates
                                    </h3>

                                    <p>
                                        No candidates
                                        with a match
                                        score of 60%
                                        or higher
                                        are currently
                                        available.
                                    </p>
                                </div>
                            ) : (
                                <div className="candidate-list">
                                    {selectedCandidate.applications.map(
                                        (
                                            application,
                                            index
                                        ) =>
                                            renderCandidateRow(
                                                application,
                                                index
                                            )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* =================================================
                    VACANCY DETAILS MODAL
                ================================================= */}

                {activeSection ===
                    "vacancy-details" &&
                    selectedVacancy && (
                        <div className="modal-overlay">
                            <div className="vacancy-details-modal">
                                <button
                                    className="modal-close"
                                    onClick={() => {
                                        setSelectedVacancy(
                                            null
                                        );

                                        setActiveSection(
                                            "job-postings"
                                        );
                                    }}
                                >
                                    ×
                                </button>

                                <p className="modal-eyebrow">
                                    VACANCY DETAILS
                                </p>

                                {detailsLoading ? (
                                    <div className="loading-message">
                                        Loading
                                        vacancy
                                        details...
                                    </div>
                                ) : (
                                    <>
                                        <div className="details-header">
                                            <div>
                                                <h2>
                                                    {
                                                        selectedVacancy.title
                                                    }
                                                </h2>

                                                <p className="details-department">
                                                    {
                                                        selectedVacancy.department
                                                    }
                                                </p>
                                            </div>

                                            <span className="details-status">
                                                {
                                                    selectedVacancy.status ||
                                                    "open"
                                                }
                                            </span>
                                        </div>

                                        <div className="details-tags">
                                            <span>
                                                {
                                                    selectedVacancy.employment_type ||
                                                    "Not specified"
                                                }
                                            </span>

                                            <span>
                                                {selectedVacancy.minimum_experience
                                                    ? `${selectedVacancy.minimum_experience}+ years experience`
                                                    : "No experience required"}
                                            </span>
                                        </div>

                                        <div className="details-section">
                                            <h3>
                                                Description
                                            </h3>

                                            <p>
                                                {
                                                    selectedVacancy.description ||
                                                    "No description provided."
                                                }
                                            </p>
                                        </div>

                                        <div className="details-section">
                                            <h3>
                                                Responsibilities
                                            </h3>

                                            <p>
                                                {
                                                    selectedVacancy.responsibilities ||
                                                    "No responsibilities added yet."
                                                }
                                            </p>
                                        </div>

                                        <div className="details-footer">
                                            <div>
                                                <span>
                                                    Created
                                                </span>

                                                <strong>
                                                    {selectedVacancy.created_at
                                                        ? new Date(
                                                              selectedVacancy.created_at
                                                          ).toLocaleDateString()
                                                        : "N/A"}
                                                </strong>
                                            </div>

                                            <div>
                                                <span>
                                                    Candidates
                                                </span>

                                                <strong>
                                                    {
                                                        selectedVacancy.candidates_count
                                                    }
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="vacancy-details-actions">
                                            <button
                                                type="button"
                                                className="close-details-button"
                                                onClick={() => {
                                                    setSelectedVacancy(
                                                        null
                                                    );

                                                    setActiveSection(
                                                        "job-postings"
                                                    );
                                                }}
                                            >
                                                Close
                                            </button>

                                            <button
                                                type="button"
                                                className="delete-vacancy-button"
                                                onClick={() =>
                                                    handleDeleteVacancy(
                                                        selectedVacancy.id
                                                    )
                                                }
                                            >
                                                Delete
                                                Vacancy
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
            </main>
        </div>
    );

    // =========================================================
    // CANDIDATE COLUMN RENDERER  ("Vacancies" flow)
    // Simple row: name, score %, View Profile button.
    // =========================================================

    function renderCandidateColumn(
        application,
        index
    ) {
        const candidate =
            application.candidate;

        const candidateUser =
            candidate?.user;

        const candidateName =
            candidateUser?.name ||
            candidate?.name ||
            application.candidate_name ||
            "Candidate";


        const score =
            getMatchScore(application);

        return (
            <div
                className="candidate-column-row"
                key={application.id}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    padding: "14px 18px",
                    borderBottom:
                        "1px solid rgba(128,128,128,0.2)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    <span
                        style={{
                            opacity: 0.5,
                            fontSize: "0.85em",
                            width: "24px",
                        }}
                    >
                        #{index + 1}
                    </span>

                    <div className="candidate-avatar">
                        {candidateName
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <strong
                        style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {candidateName}
                    </strong>
                </div>

                <div
                    style={{
                        minWidth: "80px",
                        textAlign: "center",
                    }}
                >
                    <strong>
                        {score !== null
                            ? `${score.toFixed(1)}%`
                            : "N/A"}
                    </strong>
                </div>

                <button
                    type="button"
                    className="view-candidate-button"
                    onClick={() => {
                        setSelectedCandidate({
                            applications: [
                                application,
                            ],
                            vacancyId:
                                activeVacancyId,
                        });

                        setShowExtractedText(
                            false
                        );
                    }}
                >
                    View Profile
                </button>
            </div>
        );
    }

    // =========================================================
    // CANDIDATE ROW RENDERER (detailed — Job Postings / primary
    // shortlist modal only)
    // =========================================================

    function renderCandidateRow(
        application,
        index
    ) {
        const candidate =
            application.candidate;

        const candidateUser =
            candidate?.user;

        const candidateName =
            candidateUser?.name ||
            candidate?.name ||
            application.candidate_name ||
            "Candidate";

        const candidateEmail =
            candidateUser?.email ||
            candidate?.email ||
            application.candidate_email ||
            "No email available";

        const score =
            getMatchScore(application);

        const isExpanded =
            expandedPrimaryCandidateId ===
            application.id;

        const isExtractedTextOpen =
            primaryExtractedTextId ===
            application.id;

        return (
            <div
                className={`candidate-card ${
                    index === 0
                        ? "top-candidate"
                        : ""
                }`}
                key={application.id}
            >
                {/* Always-visible summary row. Click to expand/collapse
                    and reveal the CV parsing below. */}
                <div
                    className="candidate-card-header"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                        setExpandedPrimaryCandidateId(
                            (current) =>
                                current ===
                                application.id
                                    ? null
                                    : application.id
                        )
                    }
                >
                    <div className="candidate-ranking">
                        #{index + 1}
                    </div>

                    <div className="candidate-avatar">
                        {candidateName
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="candidate-main-info">
                        <h3>
                            {candidateName}
                        </h3>

                        <p>
                            {candidateEmail}
                        </p>
                    </div>

                    <div className="candidate-score-summary">
                        <strong>
                            {score !== null
                                ? `${score.toFixed(
                                      1
                                  )}%`
                                : "N/A"}
                        </strong>

                        <span>
                            {getMatchCategory(
                                application
                            )}
                        </span>
                    </div>

                    <span
                        className={`candidate-status status-${
                            application.status ||
                            "new"
                        }`}
                    >
                        {(
                            application.status ||
                            "new"
                        ).toUpperCase()}
                    </span>

                    <span
                        style={{
                            marginLeft: "8px",
                            opacity: 0.6,
                            fontSize: "0.8em",
                        }}
                    >
                        {isExpanded ? "▲" : "▼"}
                    </span>
                </div>

                {/* Everything below only renders once the row is
                    clicked open. */}
                {isExpanded && (
                    <>
                        <div className="candidate-details-grid">
                            <div>
                                <span>
                                    Phone
                                </span>

                                <strong>
                                    {candidate?.phone ||
                                        "Not provided"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Location
                                </span>

                                <strong>
                                    {candidate?.address ||
                                        "Not provided"}
                                </strong>
                            </div>
                        </div>

                        {application.cv && (
                            <div className="cv-section">
                                <div className="cv-section-header">
                                    <div>
                                        <span className="cv-section-label">
                                            CV
                                        </span>
<button
    type="button"
    className="cv-file-link"
    onClick={(event) => {
        event.stopPropagation();
        handleViewCv(application.cv);
    }}
>
    📄{" "}
    {application.cv.file_name || "View CV"}
</button>
   
                                    </div>

                                    <span className="cv-processing-status">
                                        {application.cv
                                            .processing_status ||
                                            "pending"}
                                    </span>
                                </div>

                                <div className="cv-stats">
                                    {Object.entries(
                                        getCvStats(
                                            application.cv
                                        )
                                    ).map(
                                        ([
                                            label,
                                            value,
                                        ]) => (
                                            <div
                                                className="cv-stat"
                                                key={
                                                    label
                                                }
                                            >
                                                <span>
                                                    {label.toUpperCase()}
                                                </span>

                                                <strong>
                                                    {value}
                                                </strong>
                                            </div>
                                        )
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="extracted-text-button"
                                    onClick={(event) => {
                                        event.stopPropagation();

                                        setPrimaryExtractedTextId(
                                            (current) =>
                                                current ===
                                                application.id
                                                    ? null
                                                    : application.id
                                        );
                                    }}
                                >
                                    {isExtractedTextOpen
                                        ? "Hide extracted text"
                                        : "View extracted text"}
                                </button>

                                {isExtractedTextOpen && (
                                    <div className="extracted-text">
                                        {application.cv
                                            .extracted_text ||
                                            "No extracted text available."}
                                    </div>
                                )}
                            </div>
                        )}

                        {score !== null && (
                            <div className="matching-section">
                                <div className="matching-header">
                                    <div>
                                        <span className="matching-label">
                                            CV MATCH
                                        </span>

                                        <h4>
                                            Candidate
                                            Match
                                        </h4>

                                        <p>
                                            AI-assisted
                                            compatibility
                                            analysis for
                                            this vacancy.
                                        </p>
                                    </div>

                                    <div className="match-score-circle">
                                        <strong>
                                            {score.toFixed(
                                                1
                                            )}
                                            %
                                        </strong>

                                        <span>
                                            Match
                                        </span>
                                    </div>
                                </div>

                                <div className="match-category">
                                    <span className="match-category-dot"></span>

                                    {getMatchCategory(
                                        application
                                    )}
                                </div>

                                <div className="match-overall-bar">
                                    <div className="match-overall-header">
                                        <span>
                                            Overall
                                            match
                                            score
                                        </span>

                                        <strong>
                                            {score.toFixed(
                                                1
                                            )}{" "}
                                            / 100
                                        </strong>
                                    </div>

                                    <div className="match-bar-track">
                                        <div
                                            className="match-bar-fill overall"
                                            style={{
                                                width: `${score}%`,
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="candidate-card-footer">
                            <div>
                                <span>
                                    Application
                                    status
                                </span>

                                <select
                                    value={
                                        application.status ||
                                        "new"
                                    }
                                    disabled={
                                        statusUpdating
                                    }
                                    onClick={(event) =>
                                        event.stopPropagation()
                                    }
                                    onChange={(e) =>
                                        handleStatusChange(
                                            application.id,
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="new">
                                        New
                                    </option>

                                    <option value="screening">
                                        Screening
                                    </option>

                                    <option value="shortlisted">
                                        Shortlisted
                                    </option>

                                    <option value="hiring_manager_shortlisted">
                                        Hiring Manager Shortlisted
                                    </option>

                                    <option value="interview">
                                        Interview
                                    </option>

                                    <option value="selected">
                                        Selected
                                    </option>

                                    <option value="rejected">
                                        Rejected
                                    </option>
                                </select>
                            </div>

                            <div className="application-date">
                                <span>
                                    Applied
                                </span>

                                <strong>
                                    {application.applied_at
                                        ? new Date(
                                              application.applied_at
                                          ).toLocaleDateString()
                                        : "N/A"}
                                </strong>
                            </div>

                            <button
                                type="button"
                                className="view-candidate-button"
                                onClick={(event) => {
                                    event.stopPropagation();

                                    setSelectedCandidate(
                                        {
                                            applications: [
                                                application,
                                            ],
                                            vacancyId:
                                                activeVacancyId,
                                        }
                                    );

                                    setShowExtractedText(
                                        false
                                    );
                                }}
                            >
                                View Profile
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }
}

// =============================================================
// CANDIDATE DETAIL MODAL
// =============================================================

function CandidateDetailModal({
    selectedCandidate,
    setSelectedCandidate,
    showExtractedText,
    setShowExtractedText,
    getCvStats,
    getMatchScore,
    getMatchCategory,
    handleStatusChange,
    statusUpdating,
    handleViewCv,
}) {
    const application =
        selectedCandidate?.applications?.[0];

    if (!application) {
        return null;
    }

    const candidate =
        application.candidate;

    const candidateUser =
        candidate?.user;

    const candidateName =
        candidateUser?.name ||
        candidate?.name ||
        application.candidate_name ||
        "Candidate";

    

    const score =
        getMatchScore(application);

        const isInterviewScheduleLocked = (vacancy, interviewNumber) => {
    if (!vacancy) return false;

    const field =
        interviewNumber === 1
            ? "interview_one_locked"
            : "interview_two_locked";

    return (
        vacancy[field] === true ||
        vacancy[field] === 1 ||
        vacancy[field] === "1"
    );
};

const getInterviewVacancies = (applications) => {
    const map = new Map();

    applications.forEach((application) => {
        const vacancy =
            application.jobPosition ||
            application.job_position;

        if (vacancy?.id) {
            map.set(vacancy.id, vacancy);
        }
    });

    useEffect(() => {
    if (
        !selectedInterviewOneVacancyId &&
        interviewOneVacancies.length > 0
    ) {
        setSelectedInterviewOneVacancyId(
            String(interviewOneVacancies[0].id)
        );
    }
}, [
    interviewOneVacancies,
    selectedInterviewOneVacancyId,
]);

useEffect(() => {
    if (
        !selectedInterviewTwoVacancyId &&
        interviewTwoVacancies.length > 0
    ) {
        setSelectedInterviewTwoVacancyId(
            String(interviewTwoVacancies[0].id)
        );
    }
}, [
    interviewTwoVacancies,
    selectedInterviewTwoVacancyId,
]);


useEffect(() => {
    const vacancy =
        interviewOneVacancies.find(
            (item) =>
                String(item.id) ===
                String(selectedInterviewOneVacancyId)
        );

    if (!vacancy) return;

    if (
        isInterviewScheduleLocked(
            vacancy,
            1
        )
    ) {
        setInterviewOneDate(
            vacancy.interview_one_date
                ? String(
                      vacancy.interview_one_date
                  ).slice(0, 10)
                : ""
        );

        setInterviewOneTime(
            vacancy.interview_one_time
                ? String(
                      vacancy.interview_one_time
                  ).slice(0, 5)
                : ""
        );

        const techLead =
            interviewers.find(
                (person) =>
                    Number(person.id) ===
                    Number(
                        vacancy.interview_one_tech_lead_id
                    )
            ) || null;

        const seniorEngineer =
            interviewers.find(
                (person) =>
                    Number(person.id) ===
                    Number(
                        vacancy.interview_one_senior_engineer_id
                    )
            ) || null;

        setSelectedTechLead(
            techLead
        );

        setSelectedSeniorEngineer(
            seniorEngineer
        );
    }
}, [
    selectedInterviewOneVacancyId,
    interviewOneVacancies,
    interviewers,
]);


useEffect(() => {
    const vacancy =
        interviewTwoVacancies.find(
            (item) =>
                String(item.id) ===
                String(selectedInterviewTwoVacancyId)
        );

    if (!vacancy) return;

    if (
        isInterviewScheduleLocked(
            vacancy,
            2
        )
    ) {
        setInterviewTwoDate(
            vacancy.interview_two_date
                ? String(
                      vacancy.interview_two_date
                  ).slice(0, 10)
                : ""
        );

        setInterviewTwoTime(
            vacancy.interview_two_time
                ? String(
                      vacancy.interview_two_time
                  ).slice(0, 5)
                : ""
        );

        const hrManager =
            interviewers.find(
                (person) =>
                    Number(person.id) ===
                    Number(
                        vacancy.interview_two_hr_manager_id
                    )
            ) || null;

        const hiringManager =
            interviewers.find(
                (person) =>
                    Number(person.id) ===
                    Number(
                        vacancy.interview_two_hiring_manager_id
                    )
            ) || null;

        setSelectedHRManager(
            hrManager
        );

        setSelectedHiringManager(
            hiringManager
        );
    }
}, [
    selectedInterviewTwoVacancyId,
    interviewTwoVacancies,
    interviewers,
]);

    return Array.from(map.values());
};

const interviewOneVacancies =
    getInterviewVacancies(interviewOneCandidates);

const interviewTwoVacancies =
    getInterviewVacancies(interviewTwoCandidates);

const selectedInterviewOneVacancy =
    interviewOneVacancies.find(
        (vacancy) =>
            String(vacancy.id) ===
            String(selectedInterviewOneVacancyId)
    ) || null;

const selectedInterviewTwoVacancy =
    interviewTwoVacancies.find(
        (vacancy) =>
            String(vacancy.id) ===
            String(selectedInterviewTwoVacancyId)
    ) || null;

const formatInterviewStartTime = (time) => {
    if (!time) return "";

    const [hourText, minute] =
        String(time)
            .slice(0, 5)
            .split(":");

    let hour = Number(hourText);

    const suffix =
        hour >= 12 ? "PM" : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
};
const handleSelectForPosition = async (application) => {
    const candidateName =
        application.candidate?.user?.name ||
        application.candidate?.user?.full_name ||
        "this candidate";

    const positionName =
        application.jobPosition?.title ||
        application.job_position?.title ||
        "this position";

    const confirmed = window.confirm(
        `Are you sure you want to select ${candidateName} for the ${positionName} position?`
    );

    if (!confirmed) return;

    try {
        setError("");
        setInterviewMessage("");

        const response = await fetch(
            `${API_URL}/applications/${application.id}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: "selected",
                }),
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || "Failed to select candidate."
            );
        }

        // Update this candidate immediately
        setInterviewTwoCandidates((prev) =>
            prev.map((item) =>
                Number(item.id) === Number(application.id)
                    ? {
                          ...item,
                          status: "selected",
                      }
                    : item
            )
        );

        // Refresh applications so the UI stays in sync
        await fetchApplications();

        setInterviewMessage(
            `✓ ${candidateName} has been selected for the ${positionName} position.`
        );

    } catch (error) {
        console.error("Select for position error:", error);

        setInterviewMessage(
            error.message || "Failed to select candidate."
        );
    }
};

const primaryShortlistApplications =
    vacancyCandidateApplications
        .filter(
            (application) =>
                Number(
                    application.match_score ?? 0
                ) >= 60 &&
                application.status !== "rejected"
        )
        .sort(
            (a, b) =>
                Number(
                    b.match_score ?? 0
                ) -
                Number(
                    a.match_score ?? 0
                )
        )
        .slice(0, 5);

        

    return (
        <div className="modal-overlay">
            <div className="candidate-modal">
                <button
                    className="modal-close"
                    onClick={() => {
                        setSelectedCandidate(
                            null
                        );

                        setShowExtractedText(
                            false
                        );
                    }}
                >
                    ×
                </button>

                <p className="modal-eyebrow">
                    CANDIDATE PROFILE
                </p>

                <h2>
                    {candidateName}
                </h2>

                <p className="modal-description">
                    Candidate details and
                    recruitment information.
                </p>

                <div className="candidate-list">
                    <div className="candidate-card">
                        <div className="candidate-card-header">
                            <div className="candidate-avatar">
                                {candidateName
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div className="candidate-main-info">
                                <h3>
                                    {candidateName}
                                </h3>

                                <p>
                                    {candidateUser?.email ||
                                        candidate?.email ||
                                        "No email available"}
                                </p>
                            </div>

                            <div className="candidate-score-summary">
                                <strong>
                                    {score !==
                                    null
                                        ? `${score.toFixed(
                                              1
                                          )}%`
                                        : "N/A"}
                                </strong>

                                <span>
                                    {getMatchCategory(
                                        application
                                    )}
                                </span>
                            </div>
                        </div>

                        <div className="candidate-details-grid">
                            <div>)
                                <span>
                                    Phone
                                </span>

                                <strong>
                                    {candidate?.phone ||
                                        "Not provided"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Location
                                </span>

                                <strong>
                                    {candidate?.address ||
                                        "Not provided"}
                                </strong>
                            </div>
                        </div>

                        {application.cv && (
                            <div className="cv-section">
                                <div className="cv-section-header">
                                    <div>
                                        <span className="cv-section-label">
                                            CV
                                        </span>

                                        <button
    type="button"
    className="cv-file-link"
    onClick={() =>
        handleViewCv(application.cv)
    }
>
    📄{" "}
    {application.cv.file_name ||
        "View CV"}
</button>
                                    </div>
                                </div>

                                <div className="cv-stats">
                                    {Object.entries(
                                        getCvStats(
                                            application.cv
                                        )
                                    ).map(
                                        ([
                                            label,
                                            value,
                                        ]) => (
                                            <div
                                                className="cv-stat"
                                                key={
                                                    label
                                                }
                                            >
                                                <span>
                                                    {label.toUpperCase()}
                                                </span>

                                                <strong>
                                                    {
                                                        value
                                                    }
                                                </strong>
                                            </div>
                                        )
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="extracted-text-button"
                                    onClick={() =>
                                        setShowExtractedText(
                                            !showExtractedText
                                        )
                                    }
                                >
                                    {showExtractedText
                                        ? "Hide extracted text"
                                        : "View extracted text"}
                                </button>

                                {showExtractedText && (
                                    <div className="extracted-text">
                                        {application
                                            .cv
                                            .extracted_text ||
                                            "No extracted text available."}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="matching-section">
                            <div className="matching-header">
                                <div>
                                    <span className="matching-label">
                                        CV MATCH
                                    </span>

                                    <h4>
                                        Candidate
                                        Match
                                    </h4>

                                    <p>
                                        AI-assisted
                                        compatibility
                                        analysis.
                                    </p>
                                </div>

                                <div className="match-score-circle">
                                    <strong>
                                        {score !==
                                        null
                                            ? `${score.toFixed(
                                                  1
                                              )}%`
                                            : "N/A"}
                                    </strong>

                                    <span>
                                        Match
                                    </span>
                                </div>
                            </div>

                            <div className="match-category">
                                <span className="match-category-dot"></span>

                                {getMatchCategory(
                                    application
                                )}
                            </div>
                        </div>

                        <div className="candidate-card-footer">
                            <div>
                                <span>
                                    Application
                                    status
                                </span>

                                <select
                                    value={
                                        application.status ||
                                        "new"
                                    }
                                    disabled={
                                        statusUpdating
                                    }
                                    onChange={(e) =>
                                        handleStatusChange(
                                            application.id,
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="new">
                                        New
                                    </option>

                                    <option value="screening">
                                        Screening
                                    </option>

                                    <option value="shortlisted">
                                        Shortlisted
                                    </option>

                                    <option value="hiring_manager_shortlisted">
                                        Hiring Manager Shortlisted
                                    </option>

                                    <option value="interview">
                                        Interview
                                    </option>

                                    <option value="selected">
                                        Selected
                                    </option>

                                    <option value="rejected">
                                        Rejected
                                    </option>
                                </select>
                            </div>

                            <div className="application-date">
                                <span>
                                    Applied
                                </span>

                                <strong>
                                    {application.applied_at
                                        ? new Date(
                                              application.applied_at
                                          ).toLocaleDateString()
                                        : "N/A"}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );



}


export default HRDashboard;
