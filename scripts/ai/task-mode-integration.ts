#!/usr/bin/env node

/**
 * Task Mode Integration Script
 * 
 * Integrates collaboration modes with the existing task system
 * and provides mode validation and transition guidance.
 */

const { readFileSync, writeFileSync } = require('fs');
const { CollaborationModeManager, ModeValidators } = require('./collaboration-mode-manager');
const { generateUnifiedPreamble } = require('./unified-preamble');

interface TaskFile {
  id: string;
  shortId: string;
  status: 'todo' | 'doing' | 'done';
  mode: '战略澄清' | '方案评审' | '工程执行' | '质量验收' | '发布复盘';
  branch: string;
  lastCommit?: string;
}

function parseTaskFile(filePath: string): TaskFile {
  const content = readFileSync(filePath, 'utf-8');
  
  const idMatch = content.match(/## 短编号\n+(.+)/);
  const statusMatch = content.match(/## 状态\n+(.+)/);
  const modeMatch = content.match(/## 当前模式\n+(.+)/);
  const branchMatch = content.match(/## 分支\n+(.+)/);
  const commitMatch = content.match(/## 最近提交\n+(.+)/);
  
  return {
    id: idMatch?.[1]?.trim() || '',
    shortId: idMatch?.[1]?.trim() || '',
    status: statusMatch?.[1]?.trim() as 'todo' | 'doing' | 'done',
    mode: modeMatch?.[1]?.trim() as any,
    branch: branchMatch?.[1]?.trim() || '',
    lastCommit: commitMatch?.[1]?.trim()
  };
}

function updateTaskFile(filePath: string, updates: Partial<TaskFile>) {
  let content = readFileSync(filePath, 'utf-8');
  
  if (updates.status) {
    content = content.replace(/(## 状态\n+)(.+)/, `$1${updates.status}`);
  }
  
  if (updates.mode) {
    content = content.replace(/(## 当前模式\n+)(.+)/, `$1${updates.mode}`);
  }
  
  if (updates.branch) {
    content = content.replace(/(## 分支\n+)(.+)/, `$1${updates.branch}`);
  }
  
  if (updates.lastCommit) {
    if (content.includes('## 最近提交')) {
      content = content.replace(/(## 最近提交\n+)(.+)/, `$1${updates.lastCommit}`);
    } else {
      content += `\n## 最近提交\n${updates.lastCommit}\n`;
    }
  }
  
  writeFileSync(filePath, content);
}

function main() {
  const taskFilePath = process.argv[2];
  const action = process.argv[3];
  
  if (!taskFilePath || !action) {
    console.error('Usage: node task-mode-integration.ts <task-file> <action> [options]');
    console.error('Actions: validate, transition, preamble, mode-info');
    process.exit(1);
  }
  
  try {
    const task = parseTaskFile(taskFilePath);
    const manager = new CollaborationModeManager(task);
    
    switch (action) {
      case 'validate':
        const validation = manager.validateTask();
        console.log(JSON.stringify(validation, null, 2));
        break;
        
      case 'transition':
        const targetMode = process.argv[4] as any;
        if (!targetMode) {
          console.error('Target mode required for transition');
          process.exit(1);
        }
        const guidance = manager.getTransitionGuidance(targetMode);
        console.log(guidance);
        break;
        
      case 'preamble':
        const projectContext = {
          name: 'Compounding AI Operating System',
          description: 'AI-Native Repo for sustainable AI collaboration',
          currentMilestone: 'gstack 高价值实践七项落地里程碑',
          sourceOfTruth: ['AGENTS.md', 'memory/project/roadmap.md', 'memory/project/operating-blueprint.md']
        };
        
        const preamble = generateUnifiedPreamble({
          taskId: task.shortId,
          taskMode: manager.getCurrentMode().mode.toLowerCase() as any,
          workMode: task.mode,
          projectContext
        });
        
        console.log(preamble);
        break;
        
      case 'mode-info':
        const modeInfo = manager.getCurrentMode();
        console.log(JSON.stringify(modeInfo, null, 2));
        break;
        
      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}