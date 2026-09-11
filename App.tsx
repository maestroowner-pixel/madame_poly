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

import { AccountScreen } from './src/components/AccountScreen';
import { ArchiveScreen } from './src/components/ArchiveScreen';
import { HomeworkScreen } from './src/components/HomeworkScreen';
import { ListeningScreen } from './src/components/ListeningScreen';
import { MessageBubble } from './src/components/MessageBubble';
import { NotebookScreen } from './src/components/NotebookScreen';
import { ProfileScreen } from './src/components/ProfileScreen';
import { RecordButton } from './src/components/RecordButton';
import { SettingsScreen } from './src/components/SettingsScreen';
import { Splash } from './src/components/Splash';
import {
  MenuButton,
  ScreenMenu,
  ScreenTitle,
  type Screen as Section,
} from './src/components/ScreenMenu';
import type { Anchor } from './src/anchor';
import { TalkHeader } from './src/components/TalkHeader';
import { TutorStrip } from './src/components/TutorStrip';
import { WritingScreen } from './src/components/WritingScreen';
import { useAccount } from './src/hooks/useAccount';
import { useConversation } from './src/hooks/useConversation';
import { useZoomScreen } from './src/hooks/useZoomScreen';
import { locale, t } from './src/i18n';
import { LANGUAGES } from './src/languages';
import { CONTENT_MAX_WIDTH } from './src/layout';
import { ThemeProvider, useStyles, useTheme, type Theme } from './src/theme';
import { findTopic } from './src/topics';
import type { Message } from './src/types';

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
  const { theme } = useTheme();
  const styles = useStyles(createStyles);
  const conversation = useConversation();
  const listRef = useRef<FlatList<Message>>(null);
  const [splashDone, setSplashDone] = useState(false);
  const [section, setSection] = useState<Section>('write');
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor | null>(null);

  /**
   * Экраны, открываемые поверх вкладки. Их ровно один слой: вкладки убрали
   * вложенность, из-за которой iOS то не поднимал клавиатуру, то оставлял
   * невидимую модалку поверх всего.
   */
  const profileScreen = useZoomScreen();
  const archiveScreen = useZoomScreen();
  const accountScreen = useZoomScreen();
  const homeworkScreen = useZoomScreen();

  // Синхронизация приносит данные с других устройств — после неё лента,
  // уровни и задания перечитываются заново.
  const account = useAccount(conversation.reload);

  /** Домик отдаём экранам готовым: каждый ставит его в свой левый угол. */
  const menu = (
    <MenuButton
      onPress={(anchor) => {
        setMenuAnchor(anchor);
        setMenuOpen(true);
      }}
    />
  );

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

  // Нативная заставка держалась принудительно — снимаем её, как только наш
  // экран смонтирован: иначе приложение навсегда остаётся на стартовой картинке.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (conversation.messages.length === 0) return;
    // Новая реплика возвращает ленту вниз, даже если её листали.
    userScrolled.current = false;
    listRef.current?.scrollToEnd({ animated: true });
  }, [conversation.messages.length]);

  // Начали беседу — возвращаемся к ней и убираем всё открытое поверх.
  useEffect(() => {
    if (!conversation.sessionActive) return;
    setSection('talk');
    profileScreen.hide();
    archiveScreen.hide();
    accountScreen.hide();
    homeworkScreen.hide();
  }, [
    conversation.sessionActive,
    profileScreen.hide,
    archiveScreen.hide,
    accountScreen.hide,
    homeworkScreen.hide,
  ]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        {/* Колонка фиксированной ширины: на планшете растягивать ленту нельзя. */}
        <View style={styles.column}>
          {section === 'talk' && (
            <>
              <TalkHeader
                menu={menu}
                portrait={
                  <TutorStrip status={conversation.status} topicId={conversation.topicId} />
                }
                canArchive={conversation.messages.length > 0 && !conversation.sessionActive}
                onArchive={conversation.finishConversation}
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
                  // Высота растёт по мере дорисовки — догоняем низ на каждом шаге.
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
                  ListEmptyComponent={<Text style={styles.empty}>{t.emptyChat}</Text>}
                />
              ) : (
                <View style={styles.list}>
                  <ActivityIndicator color={theme.neon} />
                </View>
              )}

              {/* Беседа закончена и в ней были ошибки — напоминаем, где с ними
                  работать, пока разговор не ушёл в архив. */}
              {!conversation.sessionActive && correctionCount > 0 && (
                <View style={styles.remind}>
                  <Text style={styles.remindText}>
                    {conversation.homework
                      ? t.remindTaskReady(conversation.homework.exercises.length)
                      : t.remindTask(correctionCount)}
                  </Text>
                  <Text style={styles.remindHint}>{t.remindNotebook}</Text>
                  <View style={styles.remindRow}>
                    <Pressable
                      onPress={() => homeworkScreen.show(null)}
                      style={styles.remindButton}
                    >
                      <Text style={styles.remindLabel}>{t.task}</Text>
                    </Pressable>
                    <Pressable onPress={() => setSection('book')} style={styles.remindButton}>
                      <Text style={styles.remindLabel}>{t.notebookTitle}</Text>
                    </Pressable>
                  </View>
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
                  void conversation.setTurnMode(
                    conversation.turnMode === 'auto' ? 'manual' : 'auto',
                  )
                }
              />
            </>
          )}

          {section === 'listen' && (
            <ListeningScreen
              menu={menu}
              language={conversation.language}
              level={conversation.level}
              topicId={conversation.topicId}
            />
          )}

          {section === 'write' && (
            <WritingScreen
              menu={menu}
              language={conversation.language}
              level={conversation.level}
              topicId={conversation.topicId}
            />
          )}

          {section === 'book' && <NotebookScreen menu={menu} />}

          {section === 'settings' && (
            <SettingsScreen
              menu={menu}
              language={conversation.language}
              level={conversation.level}
              disabled={conversation.sessionActive}
              onSelectLanguage={conversation.switchLanguage}
              onSelectLevel={conversation.setLevel}
              topicId={conversation.topicId}
              onSelectTopic={conversation.setTopic}
              archiveCount={conversation.archive.length}
              onOpenArchive={archiveScreen.show}
              profileName={conversation.profile.name}
              onOpenProfile={profileScreen.show}
              englishVariant={conversation.englishVariant}
              onSelectVariant={conversation.setEnglishVariant}
              accountEmail={account.email}
              onOpenAccount={accountScreen.show}
            />
          )}
        </View>

        {menuOpen && (
          <ScreenMenu
            current={section}
            anchor={menuAnchor}
            onSelect={setSection}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </SafeAreaView>

      <HomeworkScreen
        visible={homeworkScreen.open}
        anchor={homeworkScreen.anchor}
        homework={conversation.homework}
        correctionCount={correctionCount}
        busy={conversation.homeworkBusy}
        messages={conversation.messages}
        title={pdfTitle}
        subtitle={pdfSubtitle}
        onGenerate={conversation.makeHomework}
        onClose={homeworkScreen.hide}
      />

      <ProfileScreen
        visible={profileScreen.open}
        anchor={profileScreen.anchor}
        speechRate={conversation.speechRate}
        onSelectRate={conversation.setSpeechRate}
        profile={conversation.profile}
        onSave={conversation.setProfile}
        onClose={profileScreen.hide}
      />

      <ArchiveScreen
        visible={archiveScreen.open}
        anchor={archiveScreen.anchor}
        archive={conversation.archive}
        profile={conversation.profile}
        onDelete={conversation.removeArchived}
        onClose={archiveScreen.hide}
      />

      <AccountScreen
        visible={accountScreen.open}
        anchor={accountScreen.anchor}
        email={account.email}
        busy={account.busy}
        syncedAt={account.syncedAt}
        onSync={account.sync}
        onClose={accountScreen.hide}
      />

      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}
    </SafeAreaProvider>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    column: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },

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

    remind: {
      gap: 6,
      marginHorizontal: 16,
      marginBottom: 8,
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    remindText: { color: theme.text, fontSize: 14, fontWeight: '700' },
    remindHint: { color: theme.textMuted, fontSize: 12, lineHeight: 17 },
    remindRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
    remindButton: {
      flex: 1,
      height: 38,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    remindLabel: { color: theme.text, fontSize: 13, fontWeight: '700' },
  });
