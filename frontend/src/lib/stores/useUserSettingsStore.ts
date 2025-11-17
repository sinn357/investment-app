import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface GoalSettings {
  totalGoal: number
  targetDate: string
  categoryGoals: Record<string, number>
  subCategoryGoals: Record<string, number>
}

interface UserSettingsState {
  // 목표 설정
  goalSettings: GoalSettings

  // 테마 및 표시 설정
  compactMode: boolean
  showAdvancedStats: boolean

  // Actions
  setGoalSettings: (settings: Partial<GoalSettings>) => void
  updateTotalGoal: (goal: number) => void
  updateTargetDate: (date: string) => void
  updateCategoryGoal: (category: string, goal: number) => void
  updateSubCategoryGoal: (subCategory: string, goal: number) => void

  toggleCompactMode: () => void
  toggleAdvancedStats: () => void

  resetSettings: () => void
}

const defaultGoalSettings: GoalSettings = {
  totalGoal: 50000000,
  targetDate: '2024-12-31',
  categoryGoals: {},
  subCategoryGoals: {},
}

export const useUserSettingsStore = create<UserSettingsState>()(
  devtools(
    persist(
      (set) => ({
        // 초기 상태
        goalSettings: defaultGoalSettings,
        compactMode: false,
        showAdvancedStats: true,

        // Actions
        setGoalSettings: (settings) =>
          set((state) => ({
            goalSettings: {
              ...state.goalSettings,
              ...settings,
            },
          })),

        updateTotalGoal: (goal) =>
          set((state) => ({
            goalSettings: {
              ...state.goalSettings,
              totalGoal: goal,
            },
          })),

        updateTargetDate: (date) =>
          set((state) => ({
            goalSettings: {
              ...state.goalSettings,
              targetDate: date,
            },
          })),

        updateCategoryGoal: (category, goal) =>
          set((state) => ({
            goalSettings: {
              ...state.goalSettings,
              categoryGoals: {
                ...state.goalSettings.categoryGoals,
                [category]: goal,
              },
            },
          })),

        updateSubCategoryGoal: (subCategory, goal) =>
          set((state) => ({
            goalSettings: {
              ...state.goalSettings,
              subCategoryGoals: {
                ...state.goalSettings.subCategoryGoals,
                [subCategory]: goal,
              },
            },
          })),

        toggleCompactMode: () =>
          set((state) => ({
            compactMode: !state.compactMode,
          })),

        toggleAdvancedStats: () =>
          set((state) => ({
            showAdvancedStats: !state.showAdvancedStats,
          })),

        resetSettings: () =>
          set({
            goalSettings: defaultGoalSettings,
            compactMode: false,
            showAdvancedStats: true,
          }),
      }),
      {
        name: 'user-settings-storage', // localStorage key
      }
    ),
    {
      name: 'UserSettingsStore', // Redux DevTools에 표시될 이름
    }
  )
)
