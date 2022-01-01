import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const resProduct = await api.get(`/products/${productId}`);
      const resStock = await api.get(`/stock/${productId}`);

      const product = resProduct.data;
      const stock = resStock.data.amount;

      const isInCart = cart.find((product) => product.id === productId);

      if (isInCart) {
        product.amount =
          cart.filter((product) => product.id === productId)[0].amount + 1;
      } else {
        product.amount = 1;
      }

      if (product.amount > stock) {
        toast.error("Quantidade solicitada fora de estoque");
      } else {
        const cartProductRemoved = cart.filter(
          (product) => product.id !== productId
        );
        const newCart = [...cartProductRemoved, product];

        setCart(newCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const isInCart = cart.find((product) => product.id === productId);

      if (isInCart) {
        const cartProductRemoved = cart.filter(
          (product) => product.id !== productId
        );

        setCart(cartProductRemoved);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(cartProductRemoved)
        );
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (!(amount <= 0)) {
        const resStock = await api.get(`/stock/${productId}`);
        const stock = resStock.data.amount;

        if (amount > stock) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        } else {
          const updatedCart = [...cart];

          const isInCart = updatedCart.find(
            (product) => product.id === productId
          );

          if (isInCart) {
            isInCart.amount = amount;

            setCart(updatedCart);
            localStorage.setItem(
              "@RocketShoes:cart",
              JSON.stringify(updatedCart)
            );
          }
        }
      } else {
        return;
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
