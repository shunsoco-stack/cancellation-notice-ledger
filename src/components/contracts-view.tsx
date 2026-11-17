"use client";

import { useState } from "react";
import { categories, decisions, states, statuses } from "@/lib/types";
import { filterAndSort } from "@/lib/contracts";
import { downloadCsv } from "@/lib/csv";
import { useLedger } from "./ledger-provider";
import { ContractForm } from "./contract-form";
import { ContractRow } from "./contract-row";
import { PageHeading } from "./page-heading";
import { Icon } from "./icon";

export function ContractsView() {
  const { contracts, today } = useLedger();
  const [adding, setAdding] = useState(false);
  const [filters, setFilters] = useState({ query: "", category: "", status: "", decision: "" });
  const [sort, setSort] = useState("deadline");
  const results = filterAndSort(contracts, today, filters, sort);
  return (
    <>
      <PageHeading
        eyebrow="ALL CONTRACTS"
        title="契約一覧"
        description="契約の条件と判断を、ひとつの台帳に。"
      >
        <button className="button primary" onClick={() => setAdding(true)}>
          <Icon name="plus" />
          契約を追加
        </button>
      </PageHeading>
      <section className="filter-panel" aria-label="契約の絞り込み">
        <label className="search-field">
          <Icon name="search" />
          <input
            aria-label="名称・提供元・担当者を検索"
            placeholder="名称・提供元・担当者で検索"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
        </label>
        <div className="filter-grid">
          <label>
            種類
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">すべての種類</option>
              {categories.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            期限・状態
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">すべての状態</option>
              <optgroup label="契約の状態">
                {states.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </optgroup>
              <optgroup label="期限の状態">
                {statuses
                  .filter((v) => v !== "解約済み")
                  .map((v) => (
                    <option key={v}>{v}</option>
                  ))}
              </optgroup>
            </select>
          </label>
          <label>
            判断
            <select
              value={filters.decision}
              onChange={(e) => setFilters({ ...filters, decision: e.target.value })}
            >
              <option value="">すべての判断</option>
              {decisions.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <button
            className="button subtle"
            onClick={() => setFilters({ query: "", category: "", status: "", decision: "" })}
          >
            絞り込みを解除
          </button>
        </div>
      </section>
      <div className="list-toolbar">
        <span>
          <strong>{results.length}</strong> 件 <small>全{contracts.length}件</small>
        </span>
        <div className="toolbar-actions">
          <select aria-label="並べ替え" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="deadline">申し出期限が近い順</option>
            <option value="amount">年額が高い順</option>
            <option value="name">名称順</option>
          </select>
          <button className="button subtle" onClick={() => downloadCsv(results, today, "契約一覧")}>
            <Icon name="download" />
            CSV
          </button>
        </div>
      </div>
      <div className="contract-list">
        {results.length ? (
          results.map((c) => <ContractRow key={c.id} contract={c} today={today} />)
        ) : (
          <div className="empty-state">
            <h2>該当する契約はありません</h2>
            <p>絞り込みを変更するか、契約を追加してください。</p>
          </div>
        )}
      </div>
      {adding && <ContractForm onClose={() => setAdding(false)} />}
    </>
  );
}
