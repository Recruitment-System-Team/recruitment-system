import { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000/api";

const STAFF_ROLES = [
    "HR Manager",
    "Hiring Manager",
    "Interviewer",
];
const STAFF_POSITIONS = [
    "HR Manager",
    "Hiring Manager",
    "Tech Lead",
    "Senior Software Engineer",
];

function AdminDashboard() {
    
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedRole, setSelectedRole] = useState("All");
const [rolesOpen, setRolesOpen] = useState(true);

const [isLightMode, setIsLightMode] = useState(false);

const [selectedUser, setSelectedUser] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "HR Manager",
    position: "HR Manager",
});

    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/admin/users`,
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
                        "Unable to fetch accounts."
                );
            }

            setUsers(data.users || []);
        } catch (error) {
            console.error(
                "ADMIN USERS ERROR:",
                error
            );

            setError(
                error.message ||
                    "Unable to load accounts."
            );
        } finally {
            setLoading(false);
        }
    };

    const totalAccounts = users.length;

    const totalStaff = users.filter(
        (account) =>
            account.role?.name !== "Candidate"
    ).length;

    const totalCandidates = users.filter(
        (account) =>
            account.role?.name === "Candidate"
    ).length;

    const staffRoles = new Set(
        users
            .filter(
                (account) =>
                    account.role?.name !== "Candidate"
            )
            .map(
                (account) =>
                    account.role?.name
            )
    ).size;

    const filteredUsers = useMemo(() => {
        if (selectedRole === "All") {
            return users;
        }

        return users.filter(
            (account) =>
                account.role?.name === selectedRole
        );
    }, [users, selectedRole]);

    const roleCounts = STAFF_ROLES.map(
        (role) => ({
            role,
            count: users.filter(
                (account) =>
                    account.role?.name === role
            ).length,
        })
    );

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const openCreateModal = (
    role = "HR Manager"
) => {
    let defaultPosition = "HR Manager";

    if (role === "Hiring Manager") {
        defaultPosition = "Hiring Manager";
    } else if (role === "Interviewer") {
        defaultPosition = "Tech Lead";
    }

    setForm({
        name: "",
        email: "",
        password: "",
        role,
        position: defaultPosition,
    });

    setCreateError("");
    setShowCreateModal(true);
};


    const handleLogout = async () => {
    try {
        if (token) {
            await fetch(`${API_URL}/logout`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        }
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
    } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("candidate_user");

        window.history.pushState(
            {},
            "",
            "/recruitment-system/admin-dashboard"
        );

        window.dispatchEvent(
            new Event("navigate")
        );
    }
};

    const createStaffAccount = async (
        event
    ) => {
        event.preventDefault();

        try {
            setCreating(true);
            setCreateError("");

            const response = await fetch(
                `${API_URL}/admin/users`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Accept: "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: JSON.stringify(form),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to create staff account."
                );
            }

            setUsers((current) => [
                data.user,
                ...current,
            ]);

            setShowCreateModal(false);

            setForm({
                name: "",
                email: "",
                password: "",
                role: "HR Manager",
                position: "HR Manager", 
            });

            alert(
                "Staff account created successfully."
            );
        } catch (error) {
            console.error(
                "CREATE STAFF ERROR:",
                error
            );

            setCreateError(
                error.message ||
                    "Unable to create staff account."
            );
        } finally {
            setCreating(false);
        }
    };

    const connectGoogleCalendar = async (account) => {
    try {
        const response = await fetch(
            `${API_URL}/admin/users/${account.id}/google-calendar/connect`,
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
                    "Unable to start Google Calendar connection."
            );
        }

        if (!data.url) {
            throw new Error(
                "Google authorization URL was not returned."
            );
        }

        window.location.href = data.url;
    } catch (error) {
        console.error(
            "GOOGLE CALENDAR CONNECT ERROR:",
            error
        );

        alert(
            error.message ||
                "Unable to connect Google Calendar."
        );
    }
};

    return (
        <div
    className={`admin-dashboard ${
        isLightMode ? "light-mode" : "dark-mode"
    }`}
>

            {/* SIDEBAR */}

            <aside className="admin-sidebar">

                <div className="admin-company">
                    <div className="admin-company-logo">
                        R
                    </div>

                    <span>
                        Recruitment System
                    </span>

                    <span className="admin-company-arrow">
                        ▾
                    </span>
                </div>

                <div className="admin-sidebar-menu">

                    <div className="admin-menu-title">
                        Workspace
                    </div>

                    <button
                        className={
                            selectedRole === "All"
                                ? "admin-menu-item active"
                                : "admin-menu-item"
                        }
                        onClick={() =>
                            setSelectedRole("All")
                        }
                    >
                        <span>⌂</span>
                        <span>Dashboard</span>
                    </button>

                    <button
                        className="admin-menu-item"
                        onClick={() =>
                            setRolesOpen(
                                !rolesOpen
                            )
                        }
                    >
                        <span>◈</span>

                        <span>Roles</span>

                        <span className="admin-menu-arrow">
                            {rolesOpen
                                ? "▲"
                                : "▼"}
                        </span>
                    </button>

                    {rolesOpen && (
                        <div className="admin-role-list">

                            {STAFF_ROLES.map(
                                (role) => (
                                    <button
                                        key={role}
                                        className={
                                            selectedRole ===
                                            role
                                                ? "admin-role-item active"
                                                : "admin-role-item"
                                        }
                                        onClick={() =>
                                            setSelectedRole(
                                                role
                                            )
                                        }
                                    >
                                        <span>•</span>
                                        <span>
                                            {role}
                                        </span>
                                    </button>
                                )
                            )}

                            <button
                                className={
                                    selectedRole ===
                                    "Candidate"
                                        ? "admin-role-item active"
                                        : "admin-role-item"
                                }
                                onClick={() =>
                                    setSelectedRole(
                                        "Candidate"
                                    )
                                }
                            >
                                <span>•</span>
                                <span>
                                    Candidates
                                </span>
                            </button>

                        </div>
                    )}

                    <button
                        className="admin-menu-item"
                        onClick={() =>
                            setSelectedRole("All")
                        }
                    >
                        <span>▣</span>
                        <span>Accounts</span>
                    </button>

                    <button
                        className="admin-menu-item"
                        onClick={() =>
                            openCreateModal()
                        }
                    >
                        <span>＋</span>
                        <span>Create Staff</span>
                    </button>

                    <div className="admin-menu-title">
                        System
                    </div>

                    <button
                        className="admin-menu-item"
                        type="button"
                    >
                        <span>⚙</span>
                        <span>Settings</span>
                    </button>

                </div>

                <div className="admin-sidebar-bottom">

                    <button
                        className="admin-profile-button"
                        type="button"
                    >
                        <span className="admin-profile-avatar">
                            {(user?.name||"A")
                                .charAt(0)
                                .toUpperCase()}
                        </span>

                        <span className="admin-profile-info">
                            <strong>
                                {user?.name ||
                                    "Administrator"}
                            </strong>

                            <small>
                                System Administrator
                            </small>
                        </span>
                    </button>
                    <button
    className="admin-logout-button"
    type="button"
    onClick={handleLogout}
>
    <span>↪</span>
    <span>Logout</span>
</button>

                </div>

            </aside>


            {/* MAIN CONTENT */}

            <main className="admin-main">

                <div className="admin-topbar">

                    <div className="admin-search">
                        Search accounts...
                    </div>

                    <button
    className="admin-theme-button"
    type="button"
    onClick={() =>
        setIsLightMode((current) => !current)
    }
>
    {isLightMode ? "☀ Light" : "◐ Dark"}
</button>

                </div>


                <div className="admin-page-header">

                    <div>
                        <p className="admin-eyebrow">
                            SYSTEM ADMINISTRATION
                        </p>

                        <h1>
                            Account Overview
                        </h1>

                        <p className="admin-description">
                            Manage staff and candidate
                            accounts across the
                            recruitment system.
                        </p>
                    </div>

                    <button
                        className="admin-create-button"
                        type="button"
                        onClick={() =>
                            openCreateModal()
                        }
                    >
                        ＋ Create Staff Account
                    </button>

                </div>


                {error && (
                    <div className="admin-error">
                        {error}
                    </div>
                )}


                {/* SUMMARY */}

                {/* SUMMARY */}

{selectedRole === "All" ? (
    <div className="admin-summary">

        <div className="admin-summary-card">
            <strong>
                {totalAccounts}
            </strong>

            <span>
                Total Accounts
            </span>
        </div>

        <div className="admin-summary-card">
            <strong>
                {totalStaff}
            </strong>

            <span>
                Total Staff
            </span>
        </div>

        <div className="admin-summary-card">
            <strong>
                {totalCandidates}
            </strong>

            <span>
                Total Candidates
            </span>
        </div>

        <div className="admin-summary-card">
            <strong>
                {staffRoles}
            </strong>

            <span>
                Staff Roles
            </span>
        </div>

    </div>
) : (
    <div className="admin-summary">

        <div className="admin-summary-card">
            <strong>
                {filteredUsers.length}
            </strong>

            <span>
                {selectedRole === "Candidate"
                    ? "Total Candidates"
                    : `Total ${selectedRole}s`}
            </span>
        </div>

    </div>
)}

                {/* STAFF DISTRIBUTION */}

                <section className="admin-section-card">

                    <div className="admin-section-heading">
                        <div>
                            <h2>
                                Staff Distribution
                            </h2>

                            <p>
                                Current number of
                                accounts under each
                                staff role.
                            </p>
                        </div>
                    </div>

                    <div className="admin-role-grid">

                        {roleCounts.map(
                            ({ role, count }) => (
                                <button
                                    key={role}
                                    type="button"
                                    className="admin-role-card"
                                    onClick={() =>
                                        setSelectedRole(
                                            role
                                        )
                                    }
                                >
                                    <strong>
                                        {count}
                                    </strong>

                                    <span>
                                        {role}
                                    </span>
                                </button>
                            )
                        )}

                    </div>

                </section>


                {/* ACCOUNTS */}

                <section className="admin-section-card">

                    <div className="admin-account-heading">

                        <div>
                            <p className="admin-eyebrow">
                                ACCOUNTS
                            </p>

                            <h2>
                                {selectedRole ===
                                "All"
                                    ? "Staff & Candidate Accounts"
                                    : `${selectedRole} Accounts`}
                            </h2>
                        </div>

                        <span className="admin-account-count">
                            {filteredUsers.length} account(s)
                        </span>

                    </div>


                    {loading ? (
                        <div className="admin-loading">
                            Loading accounts...
                        </div>
                    ) : filteredUsers.length ===
                      0 ? (
                        <div className="admin-loading">
                            No accounts found.
                        </div>
                    ) : (

                        <div className="admin-account-list">

                            {filteredUsers.map(
                                (account) => (
                                    <div
                                        key={
                                            account.id
                                        }
                                        className="admin-account-row"
                                    >

                                        <div className="admin-account-avatar">
                                            {(
                                                account.name ||
                                                "?"
                                            )
                                                .charAt(
                                                    0
                                                )
                                                .toUpperCase()}
                                        </div>

                                        <div className="admin-account-name">
                                            <strong>
                                                {
                                                    account.name
                                                }
                                            </strong>

                                            <small>
                                                Account #
                                                {
                                                    account.id
                                                }
                                            </small>
                                        </div>

                                        <div className="admin-account-email">
                                            {
                                                account.email
                                            }
                                        </div>

                                        <div className="admin-account-role">
                                            {
                                                account
                                                    .role
                                                    ?.name ||
                                                "Unknown"
                                            }
                                        </div>

                                        <button
                                            type="button"
                                            className="admin-view-button"
                                            onClick={() =>
                                                setSelectedUser(
                                                    account
                                                )
                                            }
                                        >
                                            View Profile
                                        </button>

                                       <button
    type="button"
    className="admin-calendar-button"
    onClick={() => connectGoogleCalendar(account)}
>
    {account.google_calendar_connection
        ? "Reconnect Calendar"
        : "Connect Calendar"}
</button>

                                    </div>
                                )
                            )}

                        </div>

                    )}

                </section>

            </main>


            {/* PROFILE MODAL */}

            {selectedUser && (
                <div
                    className="admin-modal-overlay"
                    onClick={() =>
                        setSelectedUser(null)
                    }
                >
                    <div
                        className="admin-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            className="admin-modal-close"
                            type="button"
                            onClick={() =>
                                setSelectedUser(null)
                            }
                        >
                            ×
                        </button>

                        <p className="admin-eyebrow">
                            ACCOUNT PROFILE
                        </p>

                        <h2>
                            {selectedUser.name}
                        </h2>

                        <p className="admin-modal-description">
                            Account information and
                            role details.
                        </p>

                        <div className="admin-details">

                            <h3>
                                Account Information
                            </h3>

                            <p>
                                <strong>
                                    Email:
                                </strong>{" "}
                                {
                                    selectedUser.email
                                }
                            </p>

                            <p>
                                <strong>
                                    Role:
                                </strong>{" "}
                                {
                                    selectedUser
                                        .role
                                        ?.name ||
                                    "Unknown"
                                }
                            </p>

                            <p>
                                <strong>
                                    Account ID:
                                </strong>{" "}
                                {
                                    selectedUser.id
                                }
                            </p>

                        </div>

                        {selectedUser.role
                            ?.name ===
                            "Candidate" &&
                            selectedUser.candidate && (
                                <div className="admin-details">

                                    <h3>
                                        Candidate
                                        Information
                                    </h3>

                                    <p>
                                        <strong>
                                            Candidate ID:
                                        </strong>{" "}
                                        {
                                            selectedUser
                                                .candidate
                                                .id
                                        }
                                    </p>

                                    <p>
                                        <strong>
                                            Phone:
                                        </strong>{" "}
                                        {
                                            selectedUser
                                                .candidate
                                                .phone ||
                                            "Not provided"
                                        }
                                    </p>

                                    <p>
                                        <strong>
                                            Address:
                                        </strong>{" "}
                                        {
                                            selectedUser
                                                .candidate
                                                .address ||
                                            "Not provided"
                                        }
                                    </p>

                                    <p>
                                        <strong>
                                            Bio:
                                        </strong>{" "}
                                        {
                                            selectedUser
                                                .candidate
                                                .bio ||
                                            "Not provided"
                                        }
                                    </p>

                                </div>
                            )}

                    </div>
                </div>
            )}


            {/* CREATE STAFF MODAL */}

            {showCreateModal && (
                <div
                    className="admin-modal-overlay"
                    onClick={() =>
                        setShowCreateModal(false)
                    }
                >

                    <div
                        className="admin-create-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            className="admin-modal-close"
                            type="button"
                            onClick={() =>
                                setShowCreateModal(
                                    false
                                )
                            }
                        >
                            ×
                        </button>

                        <p className="admin-eyebrow">
                            STAFF MANAGEMENT
                        </p>

                        <h2>
                            Create Staff Account
                        </h2>

                        <p className="admin-modal-description">
                            Create an account for a staff
                            member and assign their
                            system role.
                        </p>

                        {createError && (
                            <div className="admin-error">
                                {createError}
                            </div>
                        )}

                        <form
                            onSubmit={
                                createStaffAccount
                            }
                            className="admin-form"
                        >

                            <div className="admin-form-group">
                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        form.name
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    placeholder="Enter staff name"
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        form.email
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    placeholder="Enter staff email"
                                    required
                                />
                            </div>

                            <div className="admin-form-group">
                                <label>
                                    Password
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    value={
                                        form.password
                                    }
                                    onChange={
                                        handleFormChange
                                    }
                                    placeholder="Enter temporary password"
                                    minLength="8"
                                    required
                                />
                            </div>

                          <div className="admin-form-group">
    <label>
        Staff Role
    </label>

    <select
        name="role"
        value={
            form.role
        }
        onChange={
            handleFormChange
        }
    >
        {STAFF_ROLES
            .filter(
                (
                    role
                ) =>
                    role !==
                    "System Administrator"
            )
            .map(
                (
                    role
                ) => (
                    <option
                        key={
                            role
                        }
                        value={
                            role
                        }
                    >
                        {
                            role
                        }
                    </option>
                )
            )}
    </select>
</div>

{/* COMPANY POSITION */}

<div className="admin-form-group">
    <label>
        Company Position
    </label>

    <select
        name="position"
        value={form.position}
        onChange={handleFormChange}
        required
    >
        {STAFF_POSITIONS.map(
            (position) => (
                <option
                    key={position}
                    value={position}
                >
                    {position}
                </option>
            )
        )}
    </select>
</div>

<button
    className="admin-modal-create-button"
    type="submit"
    disabled={
        creating
    }
>
    {creating
        ? "Creating..."
        : "Create Staff Account"}
</button>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );

   
}

 

export default AdminDashboard;