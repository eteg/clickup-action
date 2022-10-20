const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');
const fetch = require('node-fetch');

// In future move this to a separate file
const CLICKUP_API = 'https://api.clickup.com/api/v2'
const STATUS = Object.freeze({
  IN_PROGRESS: 'in progress',
  CODE_REVIEW: 'code review',
  READY_FOR_QA: 'ready for qa',
  DONE: 'done'
})


// In future move this to a separate file (e.g clickup api utils)
async function changeTaskStatus(url, options, status) {
  const response = await fetch(url, {
    ...options,
    body: JSON.stringify({ status }
    )
  })
  const responseData = await response.json();
  return responseData
}

async function run() {
  try {
    const dateTime = (new Date()).toLocaleString('pt-BR');

    const { 
      ref,
      eventName,
      payload
    } = github.context;

    await exec.exec(`echo 💡 Job started at ${payload.pull_request}`);

    await exec.exec(`echo 💡 Job started at ${dateTime}`);
    await exec.exec(`echo 🖥️ Job was automatically triggered by ${eventName} event`);
    await exec.exec(`echo 🔎 The name of your branch is ${ref} and your repository is ${payload.repository.name}.`)
    
    const taskId = '' //pull_request.title.match('BRAVO-[0-9]+')[0]

    if (!taskId) {
      throw new Error('Task ID not found in PR title.')
    }

    const teamId = core.getInput('CLICKUP_TEAM_ID')

    await exec.exec(`echo ${process.env.SSH_KEY}`)

    if (!teamId || !process.env.SSH_KEY) {
      throw new Error('Params must be provided in workflow.')
    }

    //await exec.exec(`echo $SSH_KEY | base64 --decode > .env`)

    const url = `${CLICKUP_API}/task/${taskId}?custom_task_ids=true&team_id=${teamId}`
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.SSH_KEY
      },
    }

    if (ref === 'main') {
      console.log(`🚀 Status changed to ${STATUS.DONE}`)
      await changeTaskStatus(url, options, STATUS.DONE)
    } else if (ref === 'develop' ) {
      console.log(`🚀 Status changed to ${STATUS.READY_FOR_QA}`)
      await changeTaskStatus(url, options, STATUS.READY_FOR_QA)
    } else {
      throw new Error('Branch not allowed.')
    }

    await exec.exec(`echo 🎉 Job has been finished`);

  } catch (error) {
    core.setFailed(error.message);
  }
} 

run();