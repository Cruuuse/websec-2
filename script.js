let currentUrl = '/rasp?groupId=531030143';
let currentWeek;
let currentDay = new Date().getDay() === 6 ? 5 : new Date().getDay();
let styleSheet = document.createElement("style");
styleSheet.classList.add("style-sheet");
for (let i = 0; i < 6; i++) {
    if (i === currentDay) continue;
    styleSheet.innerText += `
            .column-${i} {
                display: none;
            }
            
        `
}

window.addEventListener("resize", () => {
    if (window.innerWidth < 481) {
        mobileView();
    } else if (document.querySelector(".style-sheet")) {
        document.head.removeChild(styleSheet);
    }
});

fetch('/options')
    .then((data) => data.json())
    .then((res) => {
        let selectElement = document.querySelector("#select-group");
        for (let group of res.groups) {
            let groupElement = document.createElement("option");
            groupElement.innerHTML = group.name;
            groupElement.setAttribute("value", group.link);
            selectElement.appendChild(groupElement);
        }
        selectElement.addEventListener("change", () => {
            updateData(selectElement.value);
            document.querySelector(".selected-rasp").innerHTML = res.groups.find((a) => a.link === selectElement.value).name;
            selectElement.value = "Group";
        })
        let selectElement2 = document.querySelector("#select-teacher");
        for (let teacher of res.teachers) {
            let teacherElement = document.createElement("option");
            teacherElement.innerHTML = teacher.name;
            teacherElement.setAttribute("value", teacher.link);
            selectElement2.appendChild(teacherElement);
        }
        selectElement2.addEventListener("change", () => {
            updateData(selectElement2.value);
            document.querySelector(".selected-rasp").innerHTML = res.teachers.find((a) => a.link === selectElement2.value).name;
            selectElement2.value = "Teacher";
        })
    })

function changeDay(next) {
    if (next && currentDay === 5) {
        currentDay = 0;
        return;
    }
    if (!next && currentDay === 0) {
        currentDay = 5;
        return;
    }
    next ? currentDay++ : currentDay--;
    mobileView();
}

function mobileView() {
    styleSheet.innerHTML = "";
    if (document.querySelector(".style-sheet")) {
        document.head.removeChild(styleSheet);
    }
    for (let i = 0; i < 6; i++) {
        if (i === currentDay) continue;
        styleSheet.innerText += `
            .column-${i} {
                display: none;
            }
            
        `
    }
    document.head.appendChild(styleSheet);
}

function updateData(url) {
    currentUrl = url;
    fetch(url)
        .then((data) => data.json()).then((res) => {
        generateSchedule(res);
        console.log(res);
        currentWeek = parseInt(res.currentWeek);
        if (currentWeek === 1) {
            document.querySelector("#previousWeek").style.visibility = "hidden";
        }
    })
}

function generateSchedule(data) {
    let table = document.querySelector("#schedule");
    for (let child of table.childNodes) {
        table.removeChild(child);
    }
    let header = table.insertRow();
    header.insertCell().appendChild(document.createTextNode("Время"));
    let ind = 0;
    for (let headerCell of data.dates) {
        let cell = header.insertCell();
        cell.classList.add(`column-${ind}`);
        ind++;
        cell.appendChild(document.createTextNode(headerCell));
    }
    for (let i = 0; i < data.leftColumn.length; i++) {
        let row = table.insertRow();
        row.insertCell().appendChild(document.createTextNode(data.leftColumn[i]));
        for (let j = 0; j < 6; j++) {
            let cell = row.insertCell();
            cell.classList.add(`column-${j}`);
            if (data.lessons[j].subject === null) {
                continue;
            }
            let cellData = data.lessons[j];
            cell.appendChild(document.createTextNode(cellData.subject));
            cell.appendChild(document.createTextNode(cellData.place));
            let parsedGroupsAndTeachers = cellData.groups;
            parsedGroupsAndTeachers.push(cellData.teacher);
            for (let groupOrTeacher of parsedGroupsAndTeachers) {
                let groupOrTeacherInfo = JSON.parse(groupOrTeacher);
                if (groupOrTeacherInfo.link === null) {
                    continue;
                }
                let linkElem = document.createElement("a");
                linkElem.innerHTML = groupOrTeacherInfo.name;
                linkElem.addEventListener("click", () => updateData(groupOrTeacherInfo.link));
                linkElem.classList.add("group-link");
                cell.appendChild(linkElem);
                cell.appendChild(document.createElement("br"));
            }
        }
        data.lessons = data.lessons.slice(6, data.lessons.length);
    }
}

function changeWeek(goNextPage) {
    let index = currentUrl.indexOf("&");
    if (index !== -1) {
        currentUrl = currentUrl.slice(0, index);
    }
    currentUrl += "&selectedWeek=" + (goNextPage ? ++currentWeek : --currentWeek);
    updateData(currentUrl);
}

updateData('/rasp?groupId=531030143');