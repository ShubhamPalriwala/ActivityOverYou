const core = require("@actions/core");
const github = require("@actions/github");
const axios = require("axios");

const lightsPerAxis = 4;
let commits = 0;
let issues = 0;
let pullrequests = 0;
let codereviews = 0;

let commitLights = 0;
let issueLights = 0;
let pullrequestLights = 0;
let codereviewLights = 0;

const response = {
  commitAxis: commitLights,
  issueAxis: issueLights,
  pullrequestAxis: pullrequestLights,
  codereviewAxis: codereviewLights,
};

const getUserData = async (username, ghToken) => {
  console.log(username);
  console.log(ghToken);
  const response = await axios({
    method: "get",
    url: `https://api.github.com/users/${username}/events`,
    headers: {
      Authorization: `Bearer ${ghToken}`,
    },
    params: {
      per_page: 100,
    },
  });
  response.data.forEach((ghEvent) => {
    incrementType(ghEvent);
  });
  getRatio(commits, issues, pullrequests, codereviews);
};

const incrementType = (ghEvent) => {
  switch (ghEvent.type) {
    case "PushEvent":
      commits++;
      break;
    case "IssuesEvent":
      if (ghEvent.payload.action === "opened") {
        issues++;
      }
      break;
    case "PullRequestEvent":
      if (ghEvent.payload.action === "opened") {
        pullrequests++;
      }
      break;
    case "PullRequestReviewEvent":
      if (ghEvent.payload.action === "created") {
        codereviews++;
      }
      break;
  }
};

const getRatio = (commits, issues, pullrequests, codereviews) => {
  console.log(commits, issues, pullrequests, codereviews);
  const total = commits + issues + pullrequests + codereviews;

  commitLights = Math.ceil((commits / total) * lightsPerAxis);
  issueLights = Math.ceil((issues / total) * lightsPerAxis);
  pullrequestLights = Math.ceil((pullrequests / total) * lightsPerAxis);
  codereviewLights = Math.ceil((codereviews / total) * lightsPerAxis);

  response.commitAxis = commitLights;
  response.issueAxis = issueLights;
  response.pullrequestAxis = pullrequestLights;
  response.codereviewAxis = codereviewLights;
};

try {
  const username = core.getInput("my-username");
  console.log(`Hello ${username}`);
  const time = new Date().toTimeString();
  console.log(time);
  core.setOutput("time", time);

  const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");

  getUserData(username, GITHUB_TOKEN)
    .then(() => {
      console.log(response);
    })
    .catch((err) => {
      console.log(err);
    });
} catch (error) {
  // console.log(error);
  core.setFailed(error.message);
}
