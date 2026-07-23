import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getErrorMessage } from '../utils/errorHandling'; // 🚀 Type guard import
import type { CartItem } from '../types/database';        // 🚀 Centralized type

export function useCartActions(productId: number) {
  const navigate = useNavigate();
  const [isAddedSuccess, setIsAddedSuccess] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);

  const handleDirectAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();

    if (isMutating) return;

    try {
      setIsMutating(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/login');
        return;
      }

      const { data: existingCartItem, error: fetchError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingCartItem) {
        const item = existingCartItem as Pick<CartItem, 'id' | 'quantity'>;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: item.quantity + 1 })
          .eq('id', item.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, product_id: productId, quantity: 1 }]);
        if (insertError) throw insertError;
      }

      setIsAddedSuccess(true);
      setTimeout(() => setIsAddedSuccess(false), 3000);
    } catch (err) {
      // 🛡️ Safe extraction of error parameters without using implicit any
      const readableMessage = getErrorMessage(err);
      console.error('Core Cart Action Mutation Exception Log:', readableMessage);
      alert(`Could not update your cart securely: ${readableMessage}`);
    } finally {
      setIsMutating(false);
    }
  }, [productId, navigate, isMutating]);

  return {
    isAddedSuccess,
    isMutating,
    handleDirectAddToCart
  };
}