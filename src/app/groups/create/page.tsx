'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { fetchWithToken } from '@/utils/auth';
import { createApiUrl } from '@/utils/api';

function CreateGroupPageContent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('그룹명을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      

      
      const response = await fetchWithToken(createApiUrl('/group'), {
        method: 'POST',
        body: JSON.stringify({
          title: formData.name.trim()
        }),
      });

      console.log('그룹 생성 응답 상태:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('그룹 생성 에러 응답:', errorData);
        throw new Error(`그룹 생성에 실패했습니다. (상태 코드: ${response.status})`);
      }

      const createdGroup = await response.json();
      
      // 성공 시 그룹 목록 페이지로 이동
      router.push('/groups');
    } catch (error) {
      console.error('그룹 생성 실패:', error);
      setError(error instanceof Error ? error.message : '그룹 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 입력 시 에러 메시지 제거
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl">
        <header className="sticky top-0 bg-gray-50 z-10 p-4">
          <div className="flex items-center">
            <Link href="/groups" className="mr-3 text-gray-600 hover:text-indigo-600 transition-colors">
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-indigo-900">새 그룹 만들기</h1>
          </div>
        </header>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              그룹명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="예: 우리 가족"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={!formData.name.trim() || isSubmitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                그룹 생성 중...
              </>
            ) : (
              '그룹 만들기'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreateGroupPage() {
  return (
    <ProtectedRoute>
      <CreateGroupPageContent />
    </ProtectedRoute>
  );
} 