let allMembers = [];

window.addEventListener("load", () => {

setTimeout(() => {
document.getElementById("loader").style.display = "none";
}, 800);

loadData();

});

async function loadData(){

const response = await fetch("members.json");
const data = await response.json();

allMembers = data.members;

animateCounter("memberCount", data.memberCount);

document.getElementById("serverName")
.textContent = data.serverName;

const roles = new Set();
let botCount = 0;
const roleStats = {};

data.members.forEach(member => {

if(member.bot) botCount++;

(member.roles || []).forEach(role => {

roles.add(role);

roleStats[role] = (roleStats[role] || 0) + 1;

});

});

animateCounter("roleCount", roles.size);
animateCounter("botCount", botCount);

renderRoleStats(roleStats);
renderMembers(allMembers);

}

function animateCounter(id,target){

let current=0;

const step=Math.max(
1,
Math.ceil(target/50)
);

const interval=setInterval(()=>{

current+=step;

if(current>=target){

current=target;
clearInterval(interval);

}

document.getElementById(id)
.textContent=current;

},20);

}

function renderRoleStats(stats){

const container =
document.getElementById("roleStats");

const sorted = Object.entries(stats)
.sort((a,b)=>b[1]-a[1])
.slice(0,10);

container.innerHTML = sorted.map(role=>`

<div class="role-item">
<span>${role[0]}</span>
<strong>${role[1]}</strong>
</div>

`).join("");

}

function renderMembers(members){

const grid =
document.getElementById("memberGrid");

grid.innerHTML = "";

members.forEach(member=>{

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

<div class="member-name">
${member.displayName}
</div>

<div class="member-role">
${member.roles?.join(", ") || "No Roles"}
</div>
`;

card.onclick =
()=>openModal(member);

grid.appendChild(card);

});

}

function summonCitizen(){

const member =
allMembers[
Math.floor(
Math.random()*allMembers.length
)
];

document.getElementById(
"randomCitizen"
).innerHTML =
`${member.displayName}`;

}

function openModal(member){

document.getElementById(
"memberModal"
).style.display="flex";

document.getElementById(
"modalBody"
).innerHTML =

`
<img class="avatar" src="${member.avatar}">

<h2>${member.displayName}</h2>

<p><strong>Username:</strong> ${member.username}</p>

<p><strong>Roles:</strong>
${member.roles?.join(", ") || "No Roles"}
</p>

<p><strong>Bot:</strong>
${member.bot ? "Yes" : "No"}
</p>
`;

}

function closeModal(){

document.getElementById(
"memberModal"
).style.display="none";

}

document
.getElementById("searchInput")
.addEventListener("input", e => {

const value =
e.target.value.toLowerCase();

const filtered =
allMembers.filter(member =>

(member.displayName || "")
.toLowerCase()
.includes(value)

||

(member.username || "")
.toLowerCase()
.includes(value)

);

renderMembers(filtered);

});
