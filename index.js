const core = require("@actions/core");
const axios = require("axios");

let commits = 0;
let issues = 0;
let pullrequests = 0;
let codereviews = 0;

const axisValues = {
  commitAxis: 0,
  issueAxis: 0,
  pullrequestAxis: 0,
  codereviewAxis: 0,
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
  const total = commits + issues + pullrequests + codereviews;

  axisValues.commitAxis = (commits / total) * 100;
  axisValues.issueAxis = (issues / total) * 100;
  axisValues.pullrequestAxis = (pullrequests / total) * 100;
  axisValues.codereviewAxis = (codereviews / total) * 100;
};

const username = core.getInput("my-username");

const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");

getUserData(username, GITHUB_TOKEN)
  .then(() => {
    core.setOutput("axisValues", axisValues);
    console.log(axisValues);
  })
  .catch((err) => {
    console.log(err);
  });
