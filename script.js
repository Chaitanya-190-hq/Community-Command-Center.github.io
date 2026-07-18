let membersData = [];

const memberGrid = document.getElementById("memberGrid");
const searchInput = document.getElementById("searchInput");

async function loadData() {
    try {
        const response = await fetch("members.json");
        const data = await response.json();

        membersData = data.members;

        updateStats(data);
        generateRoleAnalytics();
        renderMembers(membersData);

        setTimeout(() => {
            document.getElementById("loader").style.opacity = "0";

            setTimeout(() => {
                document.getElementById("loader").style.display = "none";
            }, 500);

        }, 1000);

    } catch (error) {
        console.error(error);

        document.body.innerHTML = `
            <div style="
                display:flex;
                justify-content:center;
                align-items:center;
                height:100vh;
                font-family:Inter;
            ">
                Failed to load members.json
            </div>
        `;
    }
}

function updateStats(data) {

    const bots = data.members.filter(m => m.bot).length;

    const roleSet = new Set();

    data.members.forEach(member => {
        member.roles.forEach(role => roleSet.add(role));
    });

    animateCounter(
        document.getElementById("memberCount"),
        data.memberCount
    );

    animateCounter(
        document.getElementById("botCount"),
        bots
    );

    animateCounter(
        document.getElementById("roleCount"),
        roleSet.size
    );

    document.getElementById("serverName").textContent =
        data.serverName;
}

function animateCounter(element, target) {

    let count = 0;

    const increment = Math.ceil(target / 50);

    const timer = setInterval(() => {

        count += increment;

        if (count >= target) {
            count = target;
            clearInterval(timer);
        }

        element.textContent = count;

    }, 20);
}

function renderMembers(members) {

    memberGrid.innerHTML = "";

    members.forEach(member => {

        const card = document.createElement("div");

        card.className = "member-card";

        card.innerHTML = `
            <img
                src="${member.avatar}"
                alt="${member.displayName}"
                loading="lazy"
            >

            <h3>${member.displayName}</h3>

            <p>@${member.username}</p>

            <span class="member-type">
                ${member.bot ? "BOT" : "MEMBER"}
            </span>
        `;

        card.addEventListener("click", () => {
            openModal(member);
        });

        memberGrid.appendChild(card);
    });
}

function openModal(member) {

    document.getElementById("memberModal").style.display = "flex";

    document.getElementById("modalBody").innerHTML = `
        <img
            src="${member.avatar}"
            style="
                width:120px;
                height:120px;
                border-radius:50%;
                margin-bottom:20px;
            "
        >

        <h2>${member.displayName}</h2>

        <p>@${member.username}</p>

        <br>

        <strong>ID:</strong><br>
        ${member.id}

        <br><br>

        <strong>Joined:</strong><br>
        ${new Date(member.joinedAt).toLocaleDateString()}

        <br><br>

        <strong>Roles:</strong>

        <div style="
            margin-top:12px;
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            justify-content:center;
        ">
            ${member.roles.map(role =>
                `<span class="role-tag">${role}</span>`
            ).join("")}
        </div>
    `;
}

function closeModal() {
    document.getElementById("memberModal").style.display = "none";
}

window.onclick = function(event) {

    const modal = document.getElementById("memberModal");

    if (event.target === modal) {
        closeModal();
    }
};

function summonCitizen() {

    if (!membersData.length) return;

    const random =
        membersData[Math.floor(Math.random() * membersData.length)];

    document.getElementById("randomCitizen").innerHTML = `
        <div style="
            margin-top:20px;
            text-align:center;
        ">
            <img
                src="${random.avatar}"
                style="
                    width:80px;
                    height:80px;
                    border-radius:50%;
                "
            >

            <h3>${random.displayName}</h3>

            <p>@${random.username}</p>
        </div>
    `;
}

function generateRoleAnalytics() {

    const roleCounter = {};

    membersData.forEach(member => {

        member.roles.forEach(role => {

            roleCounter[role] =
                (roleCounter[role] || 0) + 1;
        });
    });

    const sortedRoles = Object.entries(roleCounter)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    const container =
        document.getElementById("roleStats");

    container.innerHTML = "";

    sortedRoles.forEach(([role, count]) => {

        const item = document.createElement("div");

        item.className = "role-item";

        item.innerHTML = `
            <span>${role}</span>
            <strong>${count}</strong>
        `;

        container.appendChild(item);
    });
}

searchInput.addEventListener("input", e => {

    const value = e.target.value.toLowerCase();

    const filtered = membersData.filter(member =>

        member.displayName
            .toLowerCase()
            .includes(value)

        ||

        member.username
            .toLowerCase()
            .includes(value)
    );

    renderMembers(filtered);
});

loadData();
