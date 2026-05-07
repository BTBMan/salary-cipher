import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names'
import { task } from 'hardhat/config'

task(TASK_COMPILE).setAction(async (_, hre, runSuper) => {
  await runSuper()

  await hre.run('generate')
})
