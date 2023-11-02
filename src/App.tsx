import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

type MarketPrice = {
  adjusted_price: number;
  average_price: number;
  type_id: number;
};

const App = () => {
  const [filtredPrices, setFiltredPrices] = useState<MarketPrice[]>([]);
  const [textareaValue, setTextareaValue] = useState(() => {
    try {
      return window.localStorage.getItem("selectedIds") || "";
    } catch {
      return "";
    }
  });
  const [csv, setCsv] = useState("");

  const query = useQuery({
    queryFn: async () => {
      try {
        const response = await axios.get<MarketPrice[]>(
          "https://esi.evetech.net/latest/markets/prices/?datasource=tranquility",
        );
        return { prices: response.data, expires: response.headers["expires"] };
      } catch {
        return Promise.reject();
      }
    },
    queryKey: [""],
  });

  const handleChangeTextarea = (e) => {
    setTextareaValue(e.target.value);
  };

  const handleClickCopyCSV = () => {
    if (!query.data) return;
    if (!textareaValue) return;
    const value = textareaValue;
    const ids = value.split(";").map((i) => Number(i)) as number[];
    const filtredPrices = query.data.prices.filter((item) =>
      ids.includes(item.type_id),
    );
    const csvArray = filtredPrices.map(
      (item) => `${item.type_id};${item.average_price};${item.adjusted_price}`,
    );
    csvArray.unshift(`type_id;average_price;adjusted_price`);
    const csv = csvArray.join("\n");
    setCsv(csv);
    window.localStorage.setItem("selectedIds", textareaValue);
  };

  if (query.isLoading) return <div>Загрузка...</div>;

  if (query.isError) return <div>Ошибка загрузки</div>;

  if (query.isSuccess)
    return (
      <div>
        <details>
          <summary>Выгрузить в csv</summary>
          <p>Нужные id</p>
          <textarea
            placeholder="432;234;5345"
            rows={10}
            style={{ width: "300px" }}
            value={textareaValue}
            onChange={handleChangeTextarea}
          ></textarea>
          <div>
            <button type="button" onClick={handleClickCopyCSV}>
              Создать csv
            </button>
          </div>
          <textarea
            rows={10}
            style={{ width: "300px" }}
            value={csv}
            onChange={() => undefined}
            onClick={(e) => e.currentTarget.select()}
          ></textarea>
        </details>
        <div>Кол-во данных: {query.data.length}</div>
        <div>expires: {new Date(query.data.expires).toLocaleString()}</div>
      </div>
    );

  return <div>asd</div>;
};

export default App;
