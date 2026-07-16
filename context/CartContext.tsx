"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { CartItem, Product, ProductOptionChoice } from "@/types";
import {
  clamp,
  makeCartLineId,
  readLocalStorage,
  writeLocalStorage,
} from "@/lib/utils";

const STORAGE_KEY = "ilueats:cart:v1";

export interface AddToCartInput {
  product: Product;
  storeName: string;
  quantity?: number;
  selectedOptions?: {
    groupId: string;
    groupName: string;
    choice: ProductOptionChoice;
    /** How many of this choice (allowQuantity groups); defaults to 1. */
    qty?: number;
  }[];
  notes?: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  storeId: string | null;
  storeName: string | null;
  storeSlug: string | null;
  addItem: (input: AddToCartInput) => { ok: boolean; reason?: string };
  /**
   * Adds a whole basket at once — used by reorder. Separate from looping
   * `addItem` because that reads `storeId` from the render it was created in:
   * clearing the cart and re-adding in one tick would still see the old store
   * and reject every item. One dispatch also means one undo and one animation.
   */
  addItems: (
    inputs: AddToCartInput[],
    opts?: { replace?: boolean },
  ) => { ok: boolean; reason?: string };
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, qty: number) => void;
  clearCart: () => void;
  bump: number; // increments each successful add (for cart icon animation)
}

export const CartContext = createContext<CartContextValue | null>(null);

type CartState = {
  items: CartItem[];
  storeId: string | null;
  storeSlug: string | null;
  storeName: string | null;
};

type CartAction =
  | { type: "HYDRATE"; payload: CartState }
  | { type: "ADD"; payload: { item: CartItem; storeName: string } }
  | {
      type: "ADD_MANY";
      payload: { items: CartItem[]; storeName: string; replace: boolean };
    }
  | { type: "REMOVE"; payload: { lineId: string } }
  | { type: "SET_QTY"; payload: { lineId: string; qty: number } }
  | { type: "CLEAR" };

/** Prices a line and gives it the id that decides what merges with what. */
function buildCartItem({
  product,
  storeName,
  quantity = 1,
  selectedOptions = [],
  notes,
}: AddToCartInput): CartItem {
  const optionDelta = selectedOptions.reduce(
    (sum, o) => sum + (o.choice.priceDelta ?? 0) * (o.qty ?? 1),
    0
  );
  const lineId = makeCartLineId(
    product.id,
    selectedOptions.map((o) => ({
      groupId: o.groupId,
      choiceId: o.choice.id,
      qty: o.qty ?? 1,
    }))
  );
  return {
    id: lineId,
    productId: product.id,
    storeId: product.storeId,
    storeSlug: product.storeSlug,
    storeName,
    name: product.name,
    image: product.image,
    price: product.price + optionDelta,
    quantity,
    notes,
    selectedOptions: selectedOptions.map((o) => ({
      groupId: o.groupId,
      groupName: o.groupName,
      choiceId: o.choice.id,
      name: o.choice.name,
      qty: o.qty ?? 1,
      priceDelta: o.choice.priceDelta ?? 0,
    })),
  };
}

/** Merges a line into a list, stacking quantity onto an identical existing line. */
function mergeLine(items: CartItem[], item: CartItem): CartItem[] {
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx < 0) return [...items, item];
  return items.map((i, at) =>
    at === idx ? { ...i, quantity: i.quantity + item.quantity } : i
  );
}

const initialState: CartState = {
  items: [],
  storeId: null,
  storeSlug: null,
  storeName: null,
};

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return action.payload;

    case "ADD": {
      const { item, storeName } = action.payload;
      return {
        items: mergeLine(state.items, item),
        storeId: item.storeId,
        storeSlug: item.storeSlug,
        storeName,
      };
    }

    case "ADD_MANY": {
      const { items, storeName, replace } = action.payload;
      if (items.length === 0) return state;
      const nextItems = items.reduce(mergeLine, replace ? [] : state.items);
      const [first] = items;
      return {
        items: nextItems,
        storeId: first.storeId,
        storeSlug: first.storeSlug,
        storeName,
      };
    }

    case "REMOVE": {
      const nextItems = state.items.filter((i) => i.id !== action.payload.lineId);
      if (nextItems.length === 0) {
        return initialState;
      }
      return { ...state, items: nextItems };
    }

    case "SET_QTY": {
      const nextItems = state.items
        .map((i) =>
          i.id === action.payload.lineId
            ? { ...i, quantity: clamp(action.payload.qty, 0, 99) }
            : i
        )
        .filter((i) => i.quantity > 0);
      if (nextItems.length === 0) return initialState;
      return { ...state, items: nextItems };
    }

    case "CLEAR":
      return initialState;

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [bump, setBump] = useState(0);
  const skipNextWrite = useRef(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = readLocalStorage<CartState>(STORAGE_KEY, initialState);
    dispatch({ type: "HYDRATE", payload: stored });
    setHydrated(true);
  }, []);

  // Persist whenever state changes (skip the very first write right after hydrate)
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    writeLocalStorage(STORAGE_KEY, state);
  }, [state, hydrated]);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (input) => {
      // Single-store cart guard
      if (state.storeId && state.storeId !== input.product.storeId) {
        return {
          ok: false,
          reason: "different-store",
        };
      }

      dispatch({
        type: "ADD",
        payload: { item: buildCartItem(input), storeName: input.storeName },
      });
      setBump((b) => b + 1);
      return { ok: true };
    },
    [state.storeId]
  );

  const addItems = useCallback<CartContextValue["addItems"]>(
    (inputs, { replace = false } = {}) => {
      if (inputs.length === 0) return { ok: true };

      // `replace` is the caller having already confirmed the swap with the
      // customer, so the single-store rule only applies when it's absent.
      const [{ product, storeName }] = inputs;
      if (!replace && state.storeId && state.storeId !== product.storeId) {
        return { ok: false, reason: "different-store" };
      }

      dispatch({
        type: "ADD_MANY",
        payload: { items: inputs.map(buildCartItem), storeName, replace },
      });
      setBump((b) => b + 1);
      return { ok: true };
    },
    [state.storeId]
  );

  const removeItem = useCallback((lineId: string) => {
    dispatch({ type: "REMOVE", payload: { lineId } });
  }, []);

  const updateQuantity = useCallback((lineId: string, qty: number) => {
    dispatch({ type: "SET_QTY", payload: { lineId, qty } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
  }, []);

  const subtotal = useMemo(
    () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [state.items]
  );
  const count = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const value: CartContextValue = {
    items: state.items,
    count,
    subtotal,
    storeId: state.storeId,
    storeSlug: state.storeSlug,
    storeName: state.storeName,
    addItem,
    addItems,
    removeItem,
    updateQuantity,
    clearCart,
    bump,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
