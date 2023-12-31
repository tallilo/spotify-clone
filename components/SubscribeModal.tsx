"use client";

import { Price, ProductWithPrice } from "@/types";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import toast from "react-hot-toast";
import { postData } from "@/libs/helpers";
import { getStripe } from "@/libs/stripeClient";
import { useSubscribeModal } from "@/hooks/useSubscribeModal";

interface SubscribeModalProps {
  products: ProductWithPrice[];
}

const formatPrice = (price: Price) => {
  const priceString = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
    minimumFractionDigits: 0,
  }).format((price?.unit_amount || 0) / 100);
  return priceString;
};

const SubscribeModal = ({ products }: SubscribeModalProps) => {
  const subscribeModal = useSubscribeModal();
  const { user, isLoading, subscription } = useUser();
  const [priceIdLoading, setPriceIdLoading] = useState<string>();

  const onChange = (open: boolean) => {
    if (!open) {
      subscribeModal.onClose();
    }
  };

  const handleCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);
    if (!user) {
      setPriceIdLoading(undefined);
      return toast.error("Must be logged in");
    }
    if (subscription) {
      setPriceIdLoading(undefined);
      return toast("Already subscribed");
    }
    try {
      const { sessionId } = await postData({
        url: "/api/create-checkout-session",
        data: { price },
      });
      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPriceIdLoading(undefined);
    }
  };
  let content = <div className="text-center">No Products avaliable</div>;

  if (products.length) {
    content = (
      <div>
        {products.map((product) => {
          if (!product.prices?.length) {
            return <div key={product.id}>No prices avaliable</div>;
          }
          return product.prices.map((price) => (
            <Button
              className="mb-4"
              disabled={isLoading || price.id === priceIdLoading}
              onClick={() => handleCheckout(price)}
              key={price.id}
            >{`Subscribe for ${formatPrice(price)} a ${
              price.interval
            }`}</Button>
          ));
        })}
      </div>
    );
  }
  if (subscription) {
    content = <div className="text-center">Already Subscribe</div>;
  }
  return (
    <Modal
      isOpen={subscribeModal.isOpen}
      onChange={onChange}
      description="Listen to music with spotify Premium"
      title="Only for premium users"
    >
      {content}
    </Modal>
  );
};

export default SubscribeModal;
