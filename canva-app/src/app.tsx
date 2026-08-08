import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@canva/asset";
import { addElementAtPoint } from "@canva/design";
import type { ImageElementAtPoint } from "@canva/design";
import {
  Box,
  Button,
  Checkbox,
  Column,
  Columns,
  FormField,
  Grid,
  ImageCard,
  LoadingIndicator,
  Rows,
  Select,
  Text,
  TextInput,
  Title,
} from "@canva/app-ui-kit";
import type { SelectOption } from "@canva/app-ui-kit";
import { notification } from "@canva/platform";
import type { Oauth } from "@canva/user";
import { FormattedMessage, useIntl } from "react-intl";
import {
  NAMED_LIBRARIES,
  fetchAccountAccess,
  fetchSvgMarkup,
  formatIconifyTitle,
  searchIcons,
} from "./api";
import type { AccountAccess, IconSearchIcon } from "./types";

const ICON_SIZE = 192;
const OAUTH_SCOPE = new Set(["icons:read", "offline_access"]);

type Status =
  | { kind: "loading" }
  | { kind: "matches"; count: number }
  | { kind: "preparing"; iconName: string }
  | { kind: "inserted"; iconName: string };

type ErrorKind = "search" | "insert";
type LibrarySelectEntry = SelectOption<string> | {
  label: string;
  options: SelectOption<string>[];
};

export function App({ oauth }: { oauth: Oauth }) {
  const intl = useIntl();
  const [query, setQuery] = useState("");
  const [library, setLibrary] = useState("all");
  const [legalOnly, setLegalOnly] = useState(true);
  const [icons, setIcons] = useState<IconSearchIcon[]>([]);
  const [iconifySets, setIconifySets] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [busyIconId, setBusyIconId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "loading" });
  const [error, setError] = useState<ErrorKind | null>(null);
  const [account, setAccount] = useState<AccountAccess | null>(null);
  const [accountChecking, setAccountChecking] = useState(true);
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState(false);
  const [accountRevision, setAccountRevision] = useState(0);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreControllerRef = useRef<AbortController | null>(null);
  const filterKey = `${query}\u0000${library}\u0000${legalOnly ? "1" : "0"}`;
  const activeFilterKeyRef = useRef(filterKey);

  useEffect(() => {
    activeFilterKeyRef.current = filterKey;
  }, [filterKey]);

  const getOauthAccessToken = useCallback(async (forceRefresh = false) => {
    try {
      const response = await oauth.getAccessToken({ forceRefresh });
      return response?.token;
    } catch {
      return undefined;
    }
  }, [oauth]);

  const refreshAccount = useCallback(async (showError = false) => {
    setAccountChecking(true);
    setAccountError(false);
    try {
      const accessToken = await getOauthAccessToken();
      if (!accessToken) {
        setAccount(null);
        return;
      }
      setAccount(await fetchAccountAccess(accessToken));
    } catch {
      setAccount(null);
      setAccountError(showError);
    } finally {
      setAccountChecking(false);
    }
  }, [getOauthAccessToken]);

  useEffect(() => {
    const handle = window.setTimeout(() => void refreshAccount(), 0);
    return () => window.clearTimeout(handle);
  }, [refreshAccount]);

  const connectAccount = async () => {
    setAccountBusy(true);
    setAccountError(false);
    try {
      const response = await oauth.requestAuthorization({ scope: OAUTH_SCOPE });
      if (response.status === "completed") {
        await refreshAccount(true);
        setAccountRevision((current) => current + 1);
      }
    } catch {
      setAccountError(true);
    } finally {
      setAccountBusy(false);
    }
  };

  const disconnectAccount = async () => {
    setAccountBusy(true);
    setAccountError(false);
    try {
      await oauth.deauthorize();
      setAccount(null);
      setAccountRevision((current) => current + 1);
    } catch {
      setAccountError(true);
    } finally {
      setAccountBusy(false);
    }
  };

  const selectedIcon = useMemo(
    () => icons.find((icon) => icon.id === selectedId) || icons[0],
    [icons, selectedId],
  );

  const libraryOptions = useMemo<LibrarySelectEntry[]>(() => {
    const options: LibrarySelectEntry[] = [
      {
        value: "all",
        label: intl.formatMessage(
          {
            defaultMessage: "All libraries ({count, number}+ icons)",
            description: "Option label that searches every available icon library.",
          },
          { count: 355000 },
        ),
      },
      {
        label: intl.formatMessage({
          defaultMessage: "Icon libraries",
          description: "Group label for the primary icon libraries in the library filter.",
        }),
        options: NAMED_LIBRARIES.map(([value, label]) => ({ value, label })),
      },
    ];

    if (iconifySets.length) {
      options.push({
        label: intl.formatMessage({
          defaultMessage: "Iconify collections",
          description: "Group label for Iconify collections in the library filter.",
        }),
        options: iconifySets.map((setName) => ({
          value: `iconify:${setName}`,
          label: intl.formatMessage(
            {
              defaultMessage: "Iconify: {collectionName}",
              description: "Library filter option showing the name of an Iconify collection.",
            },
            { collectionName: formatIconifyTitle(setName) },
          ),
        })),
      });
    }

    return options;
  }, [iconifySets, intl]);

  useEffect(() => {
    const controller = new AbortController();
    loadMoreControllerRef.current?.abort();
    const handle = window.setTimeout(() => {
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      setStatus({ kind: "loading" });
      void getOauthAccessToken()
        .then((accessToken) => searchIcons({
          query,
          library,
          legalOnly,
          page: 1,
          signal: controller.signal,
          accessToken,
        }))
        .then((result) => {
          setIcons(result.icons);
          setIconifySets(result.iconifySets || []);
          setNextPage(2);
          setHasMore(result.icons.length > 0 && result.icons.length < result.total);
          setSelectedId((current) => (
            result.icons.some((icon) => icon.id === current)
              ? current
              : result.icons[0]?.id || ""
          ));
          setStatus({ kind: "matches", count: result.total });
        })
        .catch(() => {
          if (!controller.signal.aborted) setError("search");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [accountRevision, getOauthAccessToken, legalOnly, library, query]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    const requestFilterKey = filterKey;
    const requestedPage = nextPage;
    const controller = new AbortController();
    loadMoreControllerRef.current?.abort();
    loadMoreControllerRef.current = controller;
    setLoadingMore(true);
    setError(null);

    try {
      const accessToken = await getOauthAccessToken();
      const result = await searchIcons({
        query,
        library,
        legalOnly,
        page: requestedPage,
        signal: controller.signal,
        accessToken,
      });
      if (controller.signal.aborted || activeFilterKeyRef.current !== requestFilterKey) return;

      const seen = new Set(icons.map((icon) => icon.id));
      const additions = result.icons.filter((icon) => !seen.has(icon.id));
      const combined = [...icons, ...additions];
      setIconifySets(result.iconifySets || []);
      setIcons(combined);
      setHasMore(result.icons.length > 0 && combined.length < result.total);
      setNextPage(requestedPage + 1);
      setStatus({ kind: "matches", count: result.total });
    } catch {
      if (!controller.signal.aborted) setError("search");
    } finally {
      if (!controller.signal.aborted && activeFilterKeyRef.current === requestFilterKey) {
        setLoadingMore(false);
      }
    }
  }, [filterKey, getOauthAccessToken, hasMore, icons, legalOnly, library, loading, loadingMore, nextPage, query]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => () => loadMoreControllerRef.current?.abort(), []);

  async function insertIcon(icon: IconSearchIcon | undefined) {
    if (!icon) return;
    setBusyIconId(icon.id);
    setError(null);
    setStatus({ kind: "preparing", iconName: icon.displayName });

    try {
      const svg = await fetchSvgMarkup(icon);
      const dataUrl = svgToDataUrl(svg);
      const asset = await upload({
        type: "image",
        url: dataUrl,
        thumbnailUrl: dataUrl,
        mimeType: "image/svg+xml",
        name: `${icon.displayName} icon`,
        aiDisclosure: "none",
        width: ICON_SIZE,
        height: ICON_SIZE,
      });

      await asset.whenUploaded();

      const element: ImageElementAtPoint = {
        type: "image",
        ref: asset.ref,
        altText: {
          text: intl.formatMessage(
            {
              defaultMessage: "{iconName} icon",
              description: "Accessible alternative text for an icon inserted into a Canva design.",
            },
            { iconName: icon.displayName },
          ),
          decorative: false,
        },
        top: 120,
        left: 120,
        width: ICON_SIZE,
        height: ICON_SIZE,
      };

      await addElementAtPoint(element);
      setStatus({ kind: "inserted", iconName: icon.displayName });
      void notification.addToast({
        messageText: intl.formatMessage(
          {
            defaultMessage: "Inserted {iconName}.",
            description: "Success notification shown after an icon is added to the design.",
          },
          { iconName: icon.displayName },
        ),
      });
    } catch {
      setError("insert");
    } finally {
      setBusyIconId("");
    }
  }

  const selectedAlt = selectedIcon
    ? intl.formatMessage(
        {
          defaultMessage: "Preview of {iconName}",
          description: "Alternative text for the selected icon preview.",
        },
        { iconName: selectedIcon.displayName },
      )
    : "";

  return (
    <main className="app-shell">
      <Box padding="2u">
        <Rows spacing="2u">
          <Rows spacing="0.5u">
            <Title size="large">
              <FormattedMessage
                defaultMessage="Search icons"
                description="Main heading at the top of the Canva app."
              />
            </Title>
            <Text tone="secondary">
              <FormattedMessage
                defaultMessage="Find open-source SVG icons and add them to your design."
                description="Short explanation beneath the app heading."
              />
            </Text>
          </Rows>

          <Box background="neutralSubtle" border="ui" borderRadius="standard" padding="1u">
            <Rows spacing="1u">
              {accountChecking ? (
                <Text size="small" tone="secondary">
                  <FormattedMessage
                    defaultMessage="Checking account connection..."
                    description="Status shown while checking whether the Canva user connected an IconSearch account."
                  />
                </Text>
              ) : account ? (
                <>
                  <Text size="small">
                    <FormattedMessage
                      defaultMessage="Connected as {email}"
                      description="Account status showing the email address connected to IconSearch."
                      values={{ email: account.email }}
                    />
                  </Text>
                  <Button
                    variant="secondary"
                    loading={accountBusy}
                    disabled={accountBusy}
                    onClick={() => void disconnectAccount()}
                    stretch
                  >
                    {intl.formatMessage({
                      defaultMessage: "Disconnect IconSearch account",
                      description: "Button label that disconnects an IconSearch account from Canva.",
                    })}
                  </Button>
                </>
              ) : (
                <>
                  <Text size="small" tone="secondary">
                    <FormattedMessage
                      defaultMessage="You can search and add icons without an account. Connect only if you want account features."
                      description="Explanation that IconSearch authentication is optional and deferred."
                    />
                  </Text>
                  <Button
                    variant="secondary"
                    loading={accountBusy}
                    disabled={accountBusy}
                    onClick={() => void connectAccount()}
                    stretch
                  >
                    {intl.formatMessage({
                      defaultMessage: "Connect IconSearch account",
                      description: "Button label that starts the IconSearch OAuth authorization popup.",
                    })}
                  </Button>
                </>
              )}
              {accountError ? (
                <Text size="small" tone="critical">
                  <FormattedMessage
                    defaultMessage="The account connection could not be completed. Please try again."
                    description="Error shown when the IconSearch OAuth account flow fails."
                  />
                </Text>
              ) : null}
            </Rows>
          </Box>

          <Rows spacing="1.5u">
            <FormField
              label={(
                <FormattedMessage
                  defaultMessage="Search"
                  description="Label for the icon search field."
                />
              )}
              value={query}
              control={({ id, error: fieldError }) => (
                <TextInput
                  id={id}
                  type="search"
                  value={query}
                  error={fieldError}
                  onChange={setQuery}
                  placeholder={intl.formatMessage({
                    defaultMessage: "Try home, arrow, or logo",
                    description: "Example queries shown inside the icon search field.",
                  })}
                />
              )}
            />

            <FormField
              label={(
                <FormattedMessage
                  defaultMessage="Icon library"
                  description="Label for the icon library filter."
                />
              )}
              value={library}
              control={({ id, error: fieldError }) => (
                <Select
                  id={id}
                  value={library}
                  error={fieldError}
                  options={libraryOptions}
                  onChange={setLibrary}
                  stretch
                />
              )}
            />

            <Checkbox
              checked={legalOnly}
              onChange={(_value, checked) => setLegalOnly(checked)}
              label={(
                <FormattedMessage
                  defaultMessage="Show commercial-safe icons only"
                  description="Checkbox label that limits results to icons allowed for commercial use."
                />
              )}
            />
          </Rows>

          {selectedIcon ? (
            <Box background="neutralSubtle" border="ui" borderRadius="standard" padding="1u">
              <Rows spacing="1u">
                <Columns spacing="1u" alignY="center">
                  <Column width="1/3">
                    <ImageCard
                      thumbnailUrl={selectedIcon.svgUrl}
                      alt={selectedAlt}
                      thumbnailAspectRatio={1}
                      thumbnailPadding="1u"
                      thumbnailBackground="contrastOnLight"
                      borderRadius="standard"
                    />
                  </Column>
                  <Column width="2/3">
                    <Rows spacing="0.5u">
                      <Title size="small" lineClamp={2}>{selectedIcon.displayName}</Title>
                      <Text size="small" tone="secondary" lineClamp={2}>
                        <FormattedMessage
                          defaultMessage="{library} · {license}"
                          description="Metadata beneath the selected icon showing its library and license."
                          values={{
                            library: selectedIcon.libraryName,
                            license: selectedIcon.license || intl.formatMessage({
                              defaultMessage: "Open source",
                              description: "Fallback license label for an open-source icon.",
                            }),
                          }}
                        />
                      </Text>
                    </Rows>
                  </Column>
                </Columns>
                <Button
                  variant="primary"
                  loading={busyIconId === selectedIcon.id}
                  disabled={Boolean(busyIconId)}
                  onClick={() => void insertIcon(selectedIcon)}
                  stretch
                >
                  {intl.formatMessage({
                    defaultMessage: "Add selected icon to design",
                    description: "Primary button label for inserting the selected icon into the design.",
                  })}
                </Button>
              </Rows>
            </Box>
          ) : null}

          {loading && icons.length === 0 ? (
            <Rows spacing="1u" align="center">
              <LoadingIndicator size="medium" />
              <Text tone="secondary">
                <FormattedMessage
                  defaultMessage="Loading icons…"
                  description="Progress message shown while icon results are loading."
                />
              </Text>
            </Rows>
          ) : null}

          {!loading && icons.length === 0 && !error ? (
            <Text alignment="center" tone="secondary">
              <FormattedMessage
                defaultMessage="No icons found. Try another search."
                description="Empty state shown when no icons match the current filters."
              />
            </Text>
          ) : null}

          {icons.length ? (
            <Grid columns={3} spacing="1u">
              {icons.map((icon) => (
                <Rows key={icon.id} spacing="0.5u">
                  <ImageCard
                    thumbnailUrl={icon.svgUrl}
                    alt={intl.formatMessage(
                      {
                        defaultMessage: "Preview of {iconName}",
                        description: "Alternative text for an icon result preview.",
                      },
                      { iconName: icon.displayName },
                    )}
                    ariaLabel={intl.formatMessage(
                      {
                        defaultMessage: "Select {iconName}",
                        description: "Accessible label for choosing an icon result.",
                      },
                      { iconName: icon.displayName },
                    )}
                    thumbnailAspectRatio={1}
                    thumbnailPadding="1u"
                    thumbnailBackground="contrastOnLight"
                    borderRadius="standard"
                    selectable
                    selected={icon.id === selectedIcon?.id}
                    loading={busyIconId === icon.id}
                    onClick={() => setSelectedId(icon.id)}
                  />
                  <Text size="small" lineClamp={2} alignment="center">
                    {icon.displayName}
                  </Text>
                </Rows>
              ))}
            </Grid>
          ) : null}

          {hasMore ? (
            <div ref={loadMoreSentinelRef} className="load-more-sentinel">
              <Button
                variant="secondary"
                loading={loadingMore}
                disabled={loadingMore}
                onClick={() => void loadMore()}
                stretch
              >
                {intl.formatMessage({
                  defaultMessage: "Load more icons",
                  description: "Button label that loads the next page of icon search results.",
                })}
              </Button>
            </div>
          ) : null}

          <StatusMessage status={status} error={error} />
        </Rows>
      </Box>
    </main>
  );
}

function StatusMessage({ status, error }: { status: Status; error: ErrorKind | null }) {
  if (error === "search") {
    return (
      <Text tone="critical">
        <FormattedMessage
          defaultMessage="Icons could not be loaded. Check your connection and try again."
          description="Error shown when the icon catalog request fails."
        />
      </Text>
    );
  }

  if (error === "insert") {
    return (
      <Text tone="critical">
        <FormattedMessage
          defaultMessage="The selected icon could not be added. Please try again."
          description="Error shown when an icon cannot be inserted into the Canva design."
        />
      </Text>
    );
  }

  if (status.kind === "loading") {
    return (
      <Text tone="secondary">
        <FormattedMessage
          defaultMessage="Searching…"
          description="Short status message shown while icon results are loading."
        />
      </Text>
    );
  }

  if (status.kind === "preparing") {
    return (
      <Text tone="secondary">
        <FormattedMessage
          defaultMessage="Preparing {iconName}…"
          description="Status message shown while an icon is prepared for insertion."
          values={{ iconName: status.iconName }}
        />
      </Text>
    );
  }

  if (status.kind === "inserted") {
    return (
      <Text tone="secondary">
        <FormattedMessage
          defaultMessage="Inserted {iconName}."
          description="Status message shown after an icon is added to the design."
          values={{ iconName: status.iconName }}
        />
      </Text>
    );
  }

  return (
    <Text tone="secondary">
      <FormattedMessage
        defaultMessage="{count, number} matching icons"
        description="Status message showing the number of icon results that match the current filters."
        values={{ count: status.count }}
      />
    </Text>
  );
}

function svgToDataUrl(svg: string): string {
  const bytes = new TextEncoder().encode(svg);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `data:image/svg+xml;base64,${window.btoa(binary)}`;
}
