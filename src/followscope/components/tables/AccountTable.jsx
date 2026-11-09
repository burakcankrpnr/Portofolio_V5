/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { exportUsernamesCsv } from "../../lib/export/exportCsv.js";
import { Button, EmptyState } from "../ui.jsx";

const PAGE_SIZE = 50;

export default function AccountTable({
  usernames = [],
  title,
  emptyTitle,
  emptyBody,
  exportName = "followscope.csv",
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("en-US");
    let list = usernames.slice();
    if (term) list = list.filter((username) => username.includes(term));
    list.sort((a, b) => (sort === "asc" ? a.localeCompare(b, "en") : b.localeCompare(a, "en")));
    return list;
  }, [usernames, query, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!usernames.length) {
    return <EmptyState title={emptyTitle || "Sonuç yok"} body={emptyBody || "Bu listede hesap bulunmuyor."} />;
  }

  return (
    <div className="fs-card" style={{ overflow: "hidden" }}>
      <div className="fs-toolbar">
        <div className="fs-search-inline">
          <Search size={15} aria-hidden="true" />
          <input
            className="fs-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Kullanıcı adı ara"
            aria-label="Kullanıcı adı ara"
          />
        </div>
        <select
          className="fs-select"
          aria-label="Sıralama"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
        <Button
          variant="secondary"
          onClick={() => exportUsernamesCsv(filtered, exportName)}
          disabled={!filtered.length}
        >
          CSV indir
        </Button>
      </div>

      <div className="fs-table-wrap">
        <table className="fs-table">
          <thead>
            <tr>
              <th>{title || "Kullanıcı"}</th>
              <th>Profil</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((username) => (
              <tr key={username}>
                <td>
                  <span className="fs-mono">@{username}</span>
                </td>
                <td>
                  <a
                    href={`https://www.instagram.com/${username}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="fs-link"
                  >
                    Aç <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </td>
              </tr>
            ))}
            {!slice.length ? (
              <tr>
                <td colSpan={2} style={{ color: "var(--fs-muted)" }}>
                  Aramaya uyan sonuç yok
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="fs-pagination">
        <span>
          {filtered.length} hesap · sayfa {safePage}/{pages}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" disabled={safePage <= 1} onClick={() => setPage((value) => value - 1)}>
            Önceki
          </Button>
          <Button
            variant="secondary"
            disabled={safePage >= pages}
            onClick={() => setPage((value) => value + 1)}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
