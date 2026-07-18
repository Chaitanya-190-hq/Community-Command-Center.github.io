let allMembers = [];

async function loadData() {

    const response =
        await fetch("members.json");

    const data =
        await response.json();

    document.getElementById("memberCount")
        .textContent = data.memberCount;

    document.getElementById("serverName")
        .textContent = data.serverName;

    const roles = new Set();

    data.members.forEach(member => {

        if(member.roles){

            member.roles.forEach(role =>
                roles.add(role)
            );

        }

    });

    document.getElementById("roleCount")
        .textContent = roles.size;

    allMembers = data.members;

    renderMembers(allMembers);
}

function renderMembers(members){

    const grid =
        document.getElementById("memberGrid");

    grid.innerHTML = "";

    members.forEach(member => {

        const card =
            document.createElement("div");

        card.className =
            "member-card";

        card.innerHTML = `

            <img
                class="avatar"
                src="${member.avatar}"
                onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'"
            >

            <h3>${member.displayName}</h3>

            <p>${member.username}</p>

            <div class="role">
                ${member.roles?.join(", ") || "No Roles"}
            </div>

        `;

        grid.appendChild(card);

    });
}

function summonCitizen(){

    const random =
        allMembers[
            Math.floor(
                Math.random() *
                allMembers.length
            )
        ];

    document.getElementById(
        "randomCitizen"
    ).innerHTML = `

        ⚡ TARGET ACQUIRED<br><br>

        ${random.displayName}

    `;
}

document.getElementById(
    "searchInput"
).addEventListener("input", e => {

    const value =
        e.target.value.toLowerCase();

    const filtered =
        allMembers.filter(member =>

            member.displayName
                ?.toLowerCase()
                .includes(value)

            ||

            member.username
                ?.toLowerCase()
                .includes(value)

        );

    renderMembers(filtered);

});

loadData();
