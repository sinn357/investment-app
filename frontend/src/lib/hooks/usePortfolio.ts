import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PortfolioFormInput } from '../validations/portfolio'

// 백엔드 API 응답 타입
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
  // 소분류별 전용 필드들
  area_pyeong?: number
  acquisition_tax?: number
  lawyer_fee?: number
  brokerage_fee?: number
  rent_type?: string
  rental_income?: number
  jeonse_deposit?: number
  maturity_date?: string
  interest_rate?: number
  early_withdrawal_fee?: number
  current_yield?: number
  annual_yield?: number
  minimum_balance?: number
  withdrawal_fee?: number
  dividend_rate?: number
  nav?: number
  management_fee?: number
}

interface PortfolioResponse {
  status: string
  assets?: Asset[]
  asset?: Asset
  message?: string
}

const API_BASE_URL = 'https://investment-app-backend-x166.onrender.com'

// 1) 모든 자산 조회
export function useAssets(userId: number) {
  return useQuery<Asset[], Error>({
    queryKey: ['assets', userId],
    queryFn: async () => {
      console.log('[useAssets] Fetching assets for userId:', userId);
      const url = `${API_BASE_URL}/api/portfolio?user_id=${userId}`;
      console.log('[useAssets] API URL:', url);

      const response = await fetch(url);
      const data: PortfolioResponse = await response.json();

      console.log('[useAssets] API Response:', { status: data.status, hasAssets: !!data.assets, message: data.message });

      if (data.status !== 'success' || !data.assets) {
        const errorMsg = data.message || 'Failed to fetch assets';
        console.error('[useAssets] Error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('[useAssets] Success - fetched', data.assets.length, 'assets');
      return data.assets;
    },
    enabled: !!userId, // userId가 있을 때만 실행
  })
}

// 2) 자산 추가
export function useCreateAsset(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PortfolioFormInput & { user_id: number }) => {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      const response = await fetch(`${API_BASE_URL}/api/add-asset`, {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      })

      const data: PortfolioResponse = await response.json()

      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to create asset')
      }

      return data.asset
    },
    onSuccess: () => {
      // 자산 목록 무효화 → 자동 재조회
      queryClient.invalidateQueries({ queryKey: ['assets', userId] })
      toast.success('자산이 성공적으로 추가되었습니다')
    },
    onError: (error: Error) => {
      toast.error(`자산 추가 실패: ${error.message}`)
    },
  })
}

// 3) 자산 수정
export function useUpdateAsset(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Asset> & { id: number }) => {
      const response = await fetch(`${API_BASE_URL}/api/update-asset/${id}?user_id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data: PortfolioResponse = await response.json()

      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to update asset')
      }

      return data.asset
    },
    onSuccess: () => {
      // 자산 목록 무효화 → 자동 재조회
      queryClient.invalidateQueries({ queryKey: ['assets', userId] })
      toast.success('자산이 성공적으로 수정되었습니다')
    },
    onError: (error: Error) => {
      toast.error(`자산 수정 실패: ${error.message}`)
    },
  })
}

// 4) 자산 삭제
export function useDeleteAsset(userId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assetId: number) => {
      const response = await fetch(`${API_BASE_URL}/api/delete-asset/${assetId}?user_id=${userId}`, {
        method: 'DELETE',
      })

      const data: PortfolioResponse = await response.json()

      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to delete asset')
      }

      return assetId
    },
    // 낙관적 업데이트
    onMutate: async (assetId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['assets', userId] })

      // 이전 값 백업
      const previousAssets = queryClient.getQueryData<Asset[]>(['assets', userId])

      // 즉시 UI 업데이트 (삭제된 것처럼 보이게)
      queryClient.setQueryData<Asset[]>(['assets', userId], (old) =>
        old?.filter((asset) => asset.id !== assetId)
      )

      return { previousAssets }
    },
    // 성공 시
    onSuccess: () => {
      toast.success('자산이 성공적으로 삭제되었습니다')
    },
    // 에러 시 롤백
    onError: (error: Error, assetId, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(['assets', userId], context.previousAssets)
      }
      toast.error(`자산 삭제 실패: ${error.message}`)
    },
    // 성공/실패 모두 재검증
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', userId] })
    },
  })
}
