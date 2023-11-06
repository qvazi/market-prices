import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

type MarketPrice = {
  adjusted_price: number;
  average_price: number;
  type_id: number;
};

const formatToGoogleSpreadsheet = (value: number) =>
  String(value).replace(".", ",");

const App = () => {
  const csvTextareaRef = useRef<HTMLTextAreaElement | null>(null);
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

  const handleChangeTextarea: React.ChangeEventHandler<HTMLTextAreaElement> = (
    e,
  ) => {
    setTextareaValue(e.target.value);
  };

  const handleClickCopyCSV = () => {
    if (!query.data) return;

    const value = textareaValue;
    const ids = value.split(";").map((i) => Number(i)) as number[];
    const filtredPrices = query.data.prices.filter((item) =>
      ids.includes(item.type_id),
    );
    const csvArray = filtredPrices.map((item) => {
      const avgPrice = formatToGoogleSpreadsheet(item.average_price || 0);
      const adjPrice = formatToGoogleSpreadsheet(item.adjusted_price || 0);
      const id = item.type_id;
      return `${id};${avgPrice};${adjPrice}`;
    });
    let csv = "";
    if (csvArray.length) {
      csvArray.unshift(`type_id;average_price;adjusted_price`);
      window.localStorage.setItem("selectedIds", textareaValue);
      csv = csvArray.join("\n");
    }
    setCsv(csv);
    if (csvTextareaRef.current) {
      setTimeout(() => csvTextareaRef.current?.focus(), 0);
      setTimeout(() => csvTextareaRef.current?.select(), 0);
    }
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
            ref={csvTextareaRef}
            rows={10}
            style={{ width: "300px" }}
            value={csv}
            onChange={() => undefined}
            onClick={(e) => e.currentTarget.select()}
          ></textarea>
        </details>
        <div>Кол-во данных: {query.data.prices.length}</div>
        <div>expires: {new Date(query.data.expires).toLocaleString()}</div>
        <details>
          <a href="https://codesandbox.io/p/github/qvazi/market-prices/main">
            codesandbox
          </a>
          <br />
          <a href="https://github.com/qvazi/market-prices">github</a>
        </details>
      </div>
    );

  return null;
};

export default App;
