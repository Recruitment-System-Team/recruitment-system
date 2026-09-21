import { useState, useEffect } from "react";

import Login from "./pages/Login";
import HRDashboard from "./pages/HRDashboard";
import InterviewerDashboard from "./pages/InterviewerDashboard";
import CandidateLogin from "./pages/CandidateLogin";
import CandidateDashboard from "./pages/CandidateDashboard";
import Home from "./pages/Home";
import Register from "./pages/Register";
import HiringManagerDashboard from "./pages/HiringManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";

function App() {
    const getPath = () => {
        return (
            window.location.pathname.replace(
                "/recruitment-system",
                ""
            ) || "/"
        );
    };

    const [path, setPath] = useState(getPath());

    // Listen for browser navigation
    useEffect(() => {
        const handleNavigation = () => {
            setPath(getPath());
        };

        window.addEventListener("popstate", handleNavigation);
        window.addEventListener("navigate", handleNavigation);

        return () => {
            window.removeEventListener(
                "popstate",
                handleNavigation
            );
            window.removeEventListener(
                "navigate",
                handleNavigation
            );
        };
    }, []);

    // Custom navigation function
    const navigate = (to) => {
        window.history.pushState(
            {},
            "",
            `/recruitment-system${to}`
        );

        window.dispatchEvent(new Event("navigate"));
    };

    // HOME
    if (path === "/") {
        return <Home navigate={navigate} />;
    }

    // HR DASHBOARD
    if (path === "/hr-dashboard") {
        const user = JSON.parse(
            localStorage.getItem("user") || "null"
        );

        if (user?.role !== "HR Manager") {
            navigate("/staff-login");
            return null;
        }

        return <HRDashboard navigate={navigate} />;
    }


  // HIRING MANAGER DASHBOARD
if (path === "/hiring-manager-dashboard") {
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    if (user?.role !== "Hiring Manager") {
        navigate("/staff-login");
        return null;
    }

    return (
        <HiringManagerDashboard
            navigate={navigate}
        />
    );
}
// INTERVIEWER DASHBOARD
if (path === "/interviewer-dashboard") {
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    if (user?.role !== "Interviewer") {
        navigate("/staff-login");
        return null;
    }

    return (
    <InterviewerDashboard
        navigate={navigate}
    />
);
}

// SYSTEM ADMINISTRATOR DASHBOARD
if (path === "/admin-dashboard") {
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    if (user?.role !== "System Administrator") {
        navigate("/staff-login");
        return null;
    }

    return <AdminDashboard />;
}


    // Staff login
    if (path === "/staff-login") {
        return <Login navigate={navigate} />;
    }

    // CANDIDATE LOGIN
    if (path === "/candidate-login") {
        return (
            <CandidateLogin navigate={navigate} />
        );
    }

    // CANDIDATE REGISTER
    if (path === "/register-candidate") {
        return (
            <Register
                accountType="candidate"
                navigate={navigate}
            />
        );
    }

    // CANDIDATE DASHBOARD
    if (path === "/candidate-dashboard") {
        const user = JSON.parse(
            localStorage.getItem("candidate_user") || "null"
        );

        if (
            user?.role !== "Candidate" ||
            !user?.candidate_id
        ) {
            navigate("/candidate-login");
            return null;
        }

        return (
            <CandidateDashboard navigate={navigate} />
        );
    }

    // Fallback
    return <Home navigate={navigate} />;
}

export default App;