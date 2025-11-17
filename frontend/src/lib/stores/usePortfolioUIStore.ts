import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface Asset {
  id: number
  asset_type: string
  sub_category: string
  name: string
  amount: number
  quantity?: number
  avg_price?: number
  principal?: number
  evaluation_amount?: number
  profit_loss?: number
  profit_rate?: number
  date: string
  note?: string
  user_id: number
}

interface EditFormData {
  asset_type?: string
  sub_category?: string
  name?: string
  amount?: string
  quantity?: string
  avg_price?: string
  principal?: string
  eval_amount?: string
  date?: string
  note?: string
  [key: string]: string | undefined
}

interface PortfolioUIState {
  // 필터 및 정렬 상태
  selectedCategory: string
  sortBy: 'amount' | 'profit_rate' | 'name'
  sortOrder: 'asc' | 'desc'

  // 차트 뷰 상태
  chartViewType: '전체' | '대체투자' | '예치자산' | '즉시현금' | '투자자산'
  subViewType: string | null

  // 편집 모달 상태
  editingAsset: Asset | null
  editForm: EditFormData

  // 펼치기/접기 상태
  showSubcategoryGoals: boolean
  expandedCategories: Record<string, boolean>
  expandedSubCategories: Record<string, boolean>

  // 히스토리 뷰 상태
  timeRange: 'annual' | 'monthly' | 'daily'
  currentDate: Date

  // Actions
  setSelectedCategory: (category: string) => void
  setSortBy: (sortBy: 'amount' | 'profit_rate' | 'name') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  toggleSortOrder: () => void

  setChartViewType: (type: '전체' | '대체투자' | '예치자산' | '즉시현금' | '투자자산') => void
  setSubViewType: (type: string | null) => void

  openEditModal: (asset: Asset, formData: EditFormData) => void
  closeEditModal: () => void
  updateEditForm: (field: string, value: string) => void

  toggleSubcategoryGoals: () => void
  toggleCategoryExpanded: (category: string) => void
  toggleSubCategoryExpanded: (subCategory: string) => void

  setTimeRange: (range: 'annual' | 'monthly' | 'daily') => void
  setCurrentDate: (date: Date) => void

  resetFilters: () => void
}

export const usePortfolioUIStore = create<PortfolioUIState>()(
  devtools(
    persist(
      (set) => ({
        // 초기 상태
        selectedCategory: '전체',
        sortBy: 'amount',
        sortOrder: 'desc',
        chartViewType: '전체',
        subViewType: null,
        editingAsset: null,
        editForm: {},
        showSubcategoryGoals: false,
        expandedCategories: {},
        expandedSubCategories: {},
        timeRange: 'daily',
        currentDate: new Date(),

        // Actions
        setSelectedCategory: (category) =>
          set({ selectedCategory: category }),

        setSortBy: (sortBy) =>
          set({ sortBy }),

        setSortOrder: (order) =>
          set({ sortOrder: order }),

        toggleSortOrder: () =>
          set((state) => ({
            sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
          })),

        setChartViewType: (type) =>
          set({ chartViewType: type }),

        setSubViewType: (type) =>
          set({ subViewType: type }),

        openEditModal: (asset, formData) =>
          set({
            editingAsset: asset,
            editForm: formData,
          }),

        closeEditModal: () =>
          set({
            editingAsset: null,
            editForm: {},
          }),

        updateEditForm: (field, value) =>
          set((state) => ({
            editForm: {
              ...state.editForm,
              [field]: value,
            },
          })),

        toggleSubcategoryGoals: () =>
          set((state) => ({
            showSubcategoryGoals: !state.showSubcategoryGoals,
          })),

        toggleCategoryExpanded: (category) =>
          set((state) => ({
            expandedCategories: {
              ...state.expandedCategories,
              [category]: !state.expandedCategories[category],
            },
          })),

        toggleSubCategoryExpanded: (subCategory) =>
          set((state) => ({
            expandedSubCategories: {
              ...state.expandedSubCategories,
              [subCategory]: !state.expandedSubCategories[subCategory],
            },
          })),

        setTimeRange: (range) =>
          set({ timeRange: range }),

        setCurrentDate: (date) =>
          set({ currentDate: date }),

        resetFilters: () =>
          set({
            selectedCategory: '전체',
            sortBy: 'amount',
            sortOrder: 'desc',
            chartViewType: '전체',
            subViewType: null,
          }),
      }),
      {
        name: 'portfolio-ui-storage', // localStorage key
        partialize: (state) => ({
          // persist할 상태만 선택 (편집 모달 상태는 제외)
          selectedCategory: state.selectedCategory,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder,
          showSubcategoryGoals: state.showSubcategoryGoals,
          timeRange: state.timeRange,
        }),
      }
    ),
    {
      name: 'PortfolioUIStore', // Redux DevTools에 표시될 이름
    }
  )
)
