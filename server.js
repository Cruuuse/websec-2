let PORT = process.env.PORT || 2000;
let XMLHttpRequest = require('xhr2');
let http = require('http');
let express = require('express');
let app = express();
let server = http.Server(app);
let path = require('path');
let bp = require('body-parser');
let HTMLParser = require('node-html-parser');
let fs = require('fs');

// server options
app.use(express.static(__dirname));
app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, 'index.html'));
});
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

// start
server.listen(PORT, () => console.log('port :2000'));

// groups and teachers request
app.get('/options', (req, res) => {
    res.sendFile(path.join(__dirname, 'options.json'));
})

// rasp request
app.get('/rasp', (req, res) => {
    let request = new XMLHttpRequest();
    let url = "https://ssau.ru" + req.url;
    request.open("GET", url, true);
    request.send(null);
    request.onreadystatechange = () => {
        if (request.readyState == 4) {
            let schedule = {
                dates: [],
                lessons: [],
                leftColumn: []
            };
            let root = HTMLParser.parse(request.responseText);

            for (let cell of root.querySelectorAll(".schedule__item")) {
                if (cell.querySelector(".lesson-color")) {
                    let cellGroups = [];
                    if (!!cell.querySelectorAll(".schedule__group").length) {
                        for (let group of cell.querySelectorAll(".schedule__group")) {
                            if (group.innerText.trim() !== "") {
                                cellGroups.push(JSON.stringify({
                                    name: group.innerText,
                                    link: group.getAttribute("href") ?? null
                                }))
                            } else {
                                cellGroups.push(JSON.stringify({
                                    name: "",
                                    link: null
                                }))
                            }
                        }
                    } else if (!!cell.querySelectorAll(".schedule__groups").length) {
                        for (let group of cell.querySelectorAll(".schedule__groups")) {
                            if (group.innerText.trim() !== "") {
                                cellGroups.push(JSON.stringify({
                                    name: group.innerText,
                                    link: group.getAttribute("href") ?? null
                                }))
                            } else {
                                cellGroups.push(JSON.stringify({
                                    name: "",
                                    link: null
                                }))
                            }
                        }
                    }
                    schedule.lessons.push({
                        subject: cell.querySelector(".lesson-color").innerText,
                        place: cell.querySelector(".schedule__place").innerText,
                        teacher: JSON.stringify(cell.querySelector(".schedule__teacher > .caption-text") === null ?
                            {
                                name: "",
                                link: null,
                            } :
                            {
                                name: cell.querySelector(".schedule__teacher > .caption-text") ? cell.querySelector(".schedule__teacher > .caption-text").innerText : "",
                                link: cell.querySelector(".schedule__teacher > .caption-text").getAttribute("href")
                            }),
                        groups: cellGroups
                    })
                } else if (!!root.querySelectorAll(".schedule__item + .schedule__head").length && !schedule.dates.length) {
                    for (let cell of root.querySelectorAll(".schedule__item + .schedule__head")) {
                        schedule.dates.push(cell.childNodes[0].innerText + cell.childNodes[1].innerText)
                    }
                } else {
                    schedule.lessons.push({
                        subject: null
                    })
                }
            }
            for (let cell of root.querySelectorAll(".schedule__time")) {
                schedule.leftColumn.push(cell.childNodes[0].innerText + cell.childNodes[1].innerText);
            }
            schedule["currentWeek"] = root.querySelector(".week-nav-current_week")?.innerText;
            schedule.lessons = schedule.lessons.slice(6, schedule.lessons.length);
            res.send(JSON.stringify(schedule));
        }
    };
})

// all code below is to parse teachers and groups and save it to file
// do not uncomment it, other way server start will take ~3-5 minutes
function saveOptions() {
    let result = { groups: [], teachers: [] };
    let count = 0;
    let allHTMLResponses = [];

    for (let i = 1; i < 6; i++) {
        let request = new XMLHttpRequest();
        let url = "https://ssau.ru/rasp/faculty/492430598?course=" + i;
        request.open("GET", url, true);
        request.send(null);
        request.onreadystatechange = () => {
            if (request.readyState == 4) {
                let root = HTMLParser.parse(request.responseText);
                let groups = root.querySelectorAll(".group-catalog__groups > a");
                for (let group of groups) {
                    const id = group.getAttribute("href").replace(/\D/g, '');
                    result.groups.push({ name: group.innerText, link: `/rasp?groupId=${id}` })
                }
            }
        };
    }
    for (let i = 1; i < 116; i++) {
        let request = new XMLHttpRequest();
        let url = "https://ssau.ru/staff?page=" + i;
        request.open("GET", url, true);
        request.send(null);
        request.onreadystatechange = () => {
            if (request.readyState == 4) {
                count++;
                allHTMLResponses.push(request.responseText);
                if (count === 115) {
                    for (let teacher of allHTMLResponses) {
                        let root = HTMLParser.parse(teacher);
                        let teachers = root.querySelectorAll(".list-group-item > a");
                        for (let teacher of teachers) {
                            const id = teacher.getAttribute("href").replace(/\D/g, '');
                            result.teachers.push({ name: teacher.innerText, link: `/rasp?staffId=${id}` })
                        }
                    }
                    console.log('ok');
                    fs.writeFileSync("options.json", JSON.stringify(result));
                }
            }
        };
    }
}

// saveOptions();