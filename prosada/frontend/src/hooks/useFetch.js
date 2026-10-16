import { useEffect, useState } from "react";

/** Panggil fungsi service sekali saat komponen tampil. `fn` harus fungsi yang stabil (dari services/). */
export default function useFetch(fn) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    let alive = true;
    fn()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((e) => alive && setState({ data: null, error: e.message, loading: false }));
    return () => {
      alive = false;
    };
  }, [fn]);

  return state;
}
