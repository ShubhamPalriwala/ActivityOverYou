const core = require("@actions/core");
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

const axisValues = {
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

  axisValues.commitAxis = commitLights;
  axisValues.issueAxis = issueLights;
  axisValues.pullrequestAxis = pullrequestLights;
  axisValues.codereviewAxis = codereviewLights;
};

const username = core.getInput("my-username");
console.log(`Hello ${username}`);

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
getUserData(username, GITHUB_TOKEN)
  .then(() => {
    core.setOutput("axisValues", axisValues);
    console.log(axisValues);
  })
  .catch((err) => {
    console.log(err);
  });
