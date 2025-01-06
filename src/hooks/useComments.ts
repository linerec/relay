import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Comment } from '../types';

export function useComments(comicId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('comments_with_profiles')
        .select('*')
        .eq('comic_id', comicId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [comicId]);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments:${comicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `comic_id=eq.${comicId}`
        },
        async () => {
          // 모든 변경사항에 대해 전체 목록을 다시 가져옴
          await fetchComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [comicId, fetchComments]);

  const addComment = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('comments')
      .insert([{
        comic_id: comicId,
        user_id: user.id,
        content
      }]);

    if (error) throw error;
    await fetchComments(); // 즉시 새로고침
  };

  const replyToComment = async (content: string, parentId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('comments')
      .insert([{
        comic_id: comicId,
        parent_id: parentId,
        user_id: user.id,
        content
      }]);

    if (error) throw error;
    await fetchComments(); // 즉시 새로고침
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    await fetchComments(); // 즉시 새로고침
  };

  return {
    comments,
    isLoading,
    addComment,
    replyToComment,
    deleteComment
  };
}