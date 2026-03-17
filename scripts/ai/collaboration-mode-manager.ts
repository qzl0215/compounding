/**
 * Collaboration Mode Manager
 * 
 * Manages the 3 high-frequency collaboration modes and their transitions
 * based on task status and work mode changes.
 */

import { COLLABORATION_MODES, CollaborationMode } from './unified-preamble';

export interface TaskStatus {
  id: string;
  status: 'todo' | 'doing' | 'done';
  mode: '战略澄清' | '方案评审' | '工程执行' | '质量验收' | '发布复盘';
  branch: string;
  lastCommit?: string;
}

export class CollaborationModeManager {
  private currentMode: CollaborationMode;
  private taskStatus: TaskStatus;

  constructor(taskStatus: TaskStatus) {
    this.taskStatus = taskStatus;
    this.currentMode = this.inferCollaborationMode(taskStatus);
  }

  /**
   * Infer collaboration mode from task status and work mode
   */
  private inferCollaborationMode(taskStatus: TaskStatus): CollaborationMode {
    const modeMap = {
      '战略澄清': 'PLAN' as CollaborationMode,
      '方案评审': 'PLAN' as CollaborationMode,
      '工程执行': 'EXECUTE' as CollaborationMode,
      '质量验收': 'QA_REVIEW' as CollaborationMode,
      '发布复盘': 'QA_REVIEW' as CollaborationMode
    };
    
    return modeMap[taskStatus.mode] || 'PLAN';
  }

  /**
   * Get current collaboration mode details
   */
  getCurrentMode() {
    return {
      mode: this.currentMode,
      details: COLLABORATION_MODES[this.currentMode],
      taskStatus: this.taskStatus
    };
  }

  /**
   * Check if mode transition is valid
   */
  canTransitionTo(newMode: CollaborationMode): boolean {
    const validTransitions = {
      'PLAN': ['EXECUTE'],
      'EXECUTE': ['QA_REVIEW'],
      'QA_REVIEW': ['PLAN', 'EXECUTE']
    };
    
    return validTransitions[this.currentMode]?.includes(newMode) || false;
  }

  /**
   * Get mode-specific validation requirements
   */
  getModeRequirements(): string[] {
    const mode = COLLABORATION_MODES[this.currentMode];
    return [
      `模式：${mode.name} - ${mode.description}`,
      `输入要求：${mode.inputs.join('、')}`,
      `输出要求：${mode.outputs.join('、')}`,
      `进入条件：${mode.entryConditions.join('、')}`,
      `退出条件：${mode.exitConditions.join('、')}`
    ];
  }

  /**
   * Validate current task against mode requirements
   */
  validateTask(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const mode = COLLABORATION_MODES[this.currentMode];
    
    // Basic validation
    if (!this.taskStatus.id) {
      issues.push('任务 ID 缺失');
    }
    
    if (!this.taskStatus.branch) {
      issues.push('任务分支未绑定');
    }
    
    // Mode-specific validation
    switch (this.currentMode) {
      case 'PLAN':
        if (this.taskStatus.status !== 'doing' && this.taskStatus.status !== 'todo') {
          issues.push('规划模式要求任务状态为 todo 或 doing');
        }
        break;
        
      case 'EXECUTE':
        if (this.taskStatus.status !== 'doing') {
          issues.push('执行模式要求任务状态为 doing');
        }
        if (!this.taskStatus.lastCommit) {
          issues.push('执行模式需要最近提交记录');
        }
        break;
        
      case 'QA_REVIEW':
        if (this.taskStatus.status !== 'doing') {
          issues.push('验收模式要求任务状态为 doing');
        }
        break;
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Generate mode transition guidance
   */
  getTransitionGuidance(targetMode: CollaborationMode): string {
    if (!this.canTransitionTo(targetMode)) {
      return `无法从 ${this.currentMode} 直接切换到 ${targetMode}。有效切换路径：PLAN → EXECUTE → QA_REVIEW → (PLAN|EXECUTE)`;
    }
    
    const targetModeDetails = COLLABORATION_MODES[targetMode];
    const currentValidation = this.validateTask();
    
    let guidance = `切换到 ${targetMode} 模式需要：\n`;
    guidance += `1. 确保当前任务满足 ${targetMode} 模式的进入条件\n`;
    guidance += `2. 准备 ${targetModeDetails.inputs.join('、')}\n`;
    guidance += `3. 预期产出 ${targetModeDetails.outputs.join('、')}\n`;
    
    if (!currentValidation.valid) {
      guidance += `\n当前任务验证问题：\n`;
      guidance += currentValidation.issues.map(issue => `- ${issue}`).join('\n');
    }
    
    return guidance;
  }
}

/**
 * Mode-specific execution validators
 */
export const ModeValidators = {
  /**
   * Validate PLAN mode execution
   */
  validatePlanExecution(taskContent: string): { valid: boolean; missing: string[] } {
    const requiredElements = [
      '里程碑定义',
      'roadmap 更新',
      'operating-blueprint 更新',
      '规划 task'
    ];
    
    const missing = requiredElements.filter(element => 
      !taskContent.includes(element)
    );
    
    return {
      valid: missing.length === 0,
      missing
    };
  },

  /**
   * Validate EXECUTE mode execution
   */
  validateExecuteExecution(taskContent: string, hasCodeChanges: boolean): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!hasCodeChanges) {
      issues.push('未检测到代码改动');
    }
    
    if (!taskContent.includes('验收标准')) {
      issues.push('缺少验收标准定义');
    }
    
    if (!taskContent.includes('回写') || !taskContent.includes('记忆')) {
      issues.push('缺少文档/记忆回写说明');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  },

  /**
   * Validate QA_REVIEW mode execution
   */
  validateQAReviewExecution(taskContent: string, hasTestResults: boolean): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!taskContent.includes('通过') && !taskContent.includes('不通过')) {
      issues.push('缺少明确的通过/不通过结论');
    }
    
    if (!hasTestResults) {
      issues.push('缺少测试结果或运行时数据');
    }
    
    if (!taskContent.includes('风险')) {
      issues.push('缺少风险说明');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
};