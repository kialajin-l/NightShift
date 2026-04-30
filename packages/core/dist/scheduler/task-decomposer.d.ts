/**
 * NightShift 任务调度 Agent - 核心任务分解器
 * 将自然语言 PRD 自动拆解为结构化任务列表
 */
import { TaskDecompositionResult, NaturalLanguageInput, ConversationState } from './types/task.js';
/**
 * 主任务分解器
 */
export declare class TaskDecomposer {
    private keywordAnalyzer;
    private dependencyResolver;
    private dagGenerator;
    private ruleForgeIntegrator;
    private conversationManager;
    constructor();
    /**
     * 主分解方法
     */
    decompose(input: NaturalLanguageInput, sessionId?: string): Promise<TaskDecompositionResult>;
    /**
     * 从模板生成具体任务
     */
    private generateTasksFromTemplates;
    /**
     * 生成唯一任务 ID
     */
    private generateTaskId;
    /**
     * 获取对话状态
     */
    getConversationState(sessionId: string): ConversationState | undefined;
    /**
     * 获取澄清问题
     */
    getClarificationQuestions(sessionId: string): Promise<string[]>;
}
//# sourceMappingURL=task-decomposer.d.ts.map