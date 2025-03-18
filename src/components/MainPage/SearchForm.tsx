import { searchDocuments, askDocuments } from "wasp/client/operations";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";

import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Input,
  CardFooter,
  ScrollShadow,
  Button,
  Spinner,
} from "@nextui-org/react";
import { SearchIcon } from "../SearchIcon";
import { LinkIcon } from "../LinkIcons";
import { DocumentCard } from "../DocumentCard";
import { Document } from "../../types";

export function SearchForm() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ document: Document; score: number }[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState("");
  const searchForm = useForm<{
    query: string;
  }>();
  const onSearch = searchForm.handleSubmit(async (data) => {
    setIsSearching(true);
    const response = await searchDocuments(data);
    setSearchResults(response);
    setIsSearching(false);
  });
  return (
    <div>
      <Card>
        <CardHeader>Search documents</CardHeader>
        <Divider />
        <CardBody>
          <form onSubmit={onSearch}>
            <Input
              {...searchForm.register("query")}
              placeholder="Type to search..."
              startContent={<SearchIcon size={18} />}
              type="search"
              variant="bordered"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? <Spinner size="sm" /> : "Search"}
            </Button>
          </form>
        </CardBody>
      </Card>

      {searchResults && (
        <div className="mt-4">
          {searchResults.map((result) => (
            <DocumentCard
              key={result.document.id}
              document={result.document}
              footerContent={`Distance to query: ${result.score}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
