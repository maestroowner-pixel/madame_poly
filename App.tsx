import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ControlPanel } from './src/components/ControlPanel';
import { Splash } from './src/components/Splash';
import { MessageBubble } from './src/components/MessageBubble';
import { ArchiveScreen } from './src/components/ArchiveScreen';
import { MoonIcon, SunIcon } from './src/components/SchemeIcon';
import { HomeworkScreen } from './src/components/HomeworkScreen';
import { ProfileScreen } from './src/components/ProfileScreen';
import { RecordButton } from './src/components/RecordButton';
import { TutorStrip } from './src/components/TutorStrip';
import { PANEL_AUTOHIDE_MS } from './src/config';
import { LANGUAGES } from './src/languages';
import { findTopic } from './src/topics';
import { CONTENT_MAX_WIDTH } from './src/layout';
import { useConversation } from './src/hooks/useConversation';
import { ThemeProvider, useStyles, useTheme, type Theme } from './src/theme';
import type { Message } from './src/types';
import { locale, t } from './src/i18n';

// Нативная заставка держится до своей — иначе между ними мелькнёт белый кадр.
void SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <ThemeProvider>
      <Screen />
    </ThemeProvider>
  );
}

function Screen() {
  const { theme, scheme, toggle } = useTheme();
  const styles = useStyles(createStyles);
  const conversation = useConversation();
  const listRef = useRef<FlatList<Message>>(null);
  const [splashDone, setSplashDone] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [homeworkOpen, setHomeworkOpen] = useState(false);

  const correctionCount = conversation.messages.reduce(
    (total, message) => total + (message.corrections?.length ?? 0),
    0,
  );

  /** Заголовок для PDF: тема беседы или язык, если тема свободная. */
  const pdfTitle = useMemo(() => {
    const topic = findTopic(conversation.language, conversation.topicId);
    return topic ? topic.label : `${LANGUAGES[conversation.language].label} — ${t.freeTopic}`;
  }, [conversation.language, conversation.topicId]);

  const pdfSubtitle = `${LANGUAGES[conversation.language].label} · ${conversation.level} · ${new Date().toLocaleDateString(locale)}`;

  /** Фразы, по которым уже есть упражнения, — их помечаем прямо в ленте. */
  const drilled = useMemo(
    () =>
      new Set(
        (conversation.homework?.exercises ?? [])
          .map((exercise) => exercise.sourceOriginal)
          .filter((value): value is string => Boolean(value)),
      ),
    [conversation.homework],
  );
  /** Пока пользователь не увёл ленту вверх, держим её на последнем сообщении. */
  const userScrolled = useRef(false);

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (conversation.messages.length === 0) return;
    // Новая реплика возвращает ленту вниз, даже если её листали.
    userScrolled.current = false;
    listRef.current?.scrollToEnd({ animated: true });
  }, [conversation.messages.length]);

  // Панель нужна только чтобы выбрать язык и уровень — дальше она мешает.
  useEffect(() => {
    if (!panelOpen || !splashDone) return;
    const timer = setTimeout(() => setPanelOpen(false), PANEL_AUTOHIDE_MS);
    return () => clearTimeout(timer);
  }, [panelOpen, splashDone, conversation.language, conversation.level]);

  // Начали беседу — убираем панель сразу, не дожидаясь таймера.
  useEffect(() => {
    if (conversation.sessionActive) setPanelOpen(false);
  }, [conversation.sessionActive]);

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {/* Колонка фиксированной ширины: на планшете растягивать ленту нельзя. */}
        <View style={styles.column}>
        <ControlPanel
          language={conversation.language}
          level={conversation.level}
          expanded={panelOpen}
          disabled={conversation.sessionActive}
          onToggle={() => setPanelOpen((open) => !open)}
          onSelectLanguage={conversation.switchLanguage}
          onSelectLevel={conversation.setLevel}
          topicId={conversation.topicId}
          onSelectTopic={conversation.setTopic}
          archiveCount={conversation.archive.length}
          onOpenArchive={() => setArchiveOpen(true)}
          profileName={conversation.profile.name}
          onOpenProfile={() => setProfileOpen(true)}
          homeworkCount={conversation.homework?.exercises.length ?? null}
          onOpenHomework={() => setHomeworkOpen(true)}
          center={<TutorStrip status={conversation.status} topicId={conversation.topicId} />}
          trailing={
            <View style={styles.actions}>
              <Pressable
                onPress={conversation.finishConversation}
                disabled={conversation.messages.length === 0 || conversation.sessionActive}
                hitSlop={12}
              >
                <Text
                  style={[
                    styles.reset,
                    (conversation.messages.length === 0 || conversation.sessionActive) &&
                      styles.resetDisabled,
                  ]}
                >
                  {t.toArchive}
                </Text>
              </Pressable>
              <Pressable onPress={toggle} hitSlop={12} style={styles.schemeButton}>
                {scheme === 'dark' ? (
                  <MoonIcon size={26} color={theme.text} cutout={theme.surfaceAlt} />
                ) : (
                  <SunIcon size={26} color={theme.text} />
                )}
              </Pressable>
            </View>
          }
        />

        {conversation.error && (
          <Pressable onPress={conversation.dismissError} style={styles.error}>
            <Text style={styles.errorText}>{conversation.error}</Text>
          </Pressable>
        )}

        {conversation.ready ? (
          <FlatList
            ref={listRef}
            data={conversation.messages}
            keyExtractor={(message) => message.id}
            contentContainerStyle={styles.list}
            // Высота растёт по мере дорисовки элементов — догоняем низ на каждом шаге.
            onContentSizeChange={() => {
              if (userScrolled.current || conversation.messages.length === 0) return;
              listRef.current?.scrollToEnd({ animated: false });
            }}
            onScrollBeginDrag={() => {
              userScrolled.current = true;
            }}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                profile={conversation.profile}
                topicId={conversation.topicId}
                drilled={drilled}
                onReplay={conversation.replay}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {t.emptyChat}
              </Text>
            }
          />
        ) : (
          <View style={styles.list}>
            <ActivityIndicator color={theme.accent} />
          </View>
        )}

        <RecordButton
          status={conversation.status}
          sessionActive={conversation.sessionActive}
          durationMillis={conversation.durationMillis}
          mode={conversation.turnMode}
          onToggleSession={conversation.toggleSession}
          onEndTurn={conversation.endTurn}
          onBeginTurn={conversation.beginTurn}
          inputLevel={conversation.inputLevel}
          onToggleMode={() =>
            void conversation.setTurnMode(conversation.turnMode === 'auto' ? 'manual' : 'auto')
          }
        />
        </View>
        <HomeworkScreen
          visible={homeworkOpen}
          homework={conversation.homework}
          correctionCount={correctionCount}
          busy={conversation.homeworkBusy}
          messages={conversation.messages}
          title={pdfTitle}
          subtitle={pdfSubtitle}
          onGenerate={conversation.makeHomework}
          onClose={() => setHomeworkOpen(false)}
        />

        <ProfileScreen
          visible={profileOpen}
          profile={conversation.profile}
          onSave={conversation.setProfile}
          onClose={() => setProfileOpen(false)}
        />

        <ArchiveScreen
          visible={archiveOpen}
          archive={conversation.archive}
          profile={conversation.profile}
          onDelete={conversation.removeArchived}
          onClose={() => setArchiveOpen(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    column: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    reset: { color: theme.accent, fontSize: 13, fontWeight: '600' },
    resetDisabled: { color: theme.textMuted, opacity: 0.45, fontWeight: '400' },
    schemeButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    error: {
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.dangerBg,
      borderWidth: 1,
      borderColor: theme.danger,
    },
    errorText: { color: theme.dangerText, fontSize: 12 },
    list: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 8, justifyContent: 'center' },
    empty: {
      color: theme.textMuted,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 20,
      paddingHorizontal: 24,
    },
  });
