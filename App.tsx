import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreen } from './src/components/AccountScreen';
import { ArchiveScreen } from './src/components/ArchiveScreen';
import { Toast } from './src/components/Toast';
import { ExamScreen } from './src/components/ExamScreen';
import { GrammarScreen } from './src/components/GrammarScreen';
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
import { measureAnchor, type Anchor } from './src/anchor';
import { Paywall } from './src/components/Paywall';
import { useSubscription } from './src/hooks/useSubscription';
import { TalkHeader } from './src/components/TalkHeader';
import { TutorStrip } from './src/components/TutorStrip';
import { VocabularyScreen } from './src/components/VocabularyScreen';
import { WritingScreen } from './src/components/WritingScreen';
import { useAccount } from './src/hooks/useAccount';
import { useConversation } from './src/hooks/useConversation';
import { useZoomScreen } from './src/hooks/useZoomScreen';
import { locale, t } from './src/i18n';
import { LANGUAGES } from './src/languages';
import { BUTTON_SCALE, CONTENT_MAX_WIDTH, IS_TABLET, UI_SCALE } from './src/layout';
import { FREE_TURNS_PER_TALK, UNLIMITED_TALKS, VOCABULARY_LANGUAGES } from './src/config';
import { dueCards } from './src/review';
import { ensureMicrophone } from './src/services/microphone';
import { syncReminders } from './src/services/reminders';
import { loadReviewCards } from './src/storage';
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
  const [section, setSection] = useState<Section>('talk');

  const subscription = useSubscription();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallAnchor, setPaywallAnchor] = useState<Anchor | null>(null);
  const recordRef = useRef<View>(null);

  /**
   * Лимит сторожит только начало беседы: остановить её нужно уметь всегда, а
   * счётчик растёт в момент запуска, а не по завершении — иначе беседу можно
   * было бы вести бесконечно, ни разу её не закрыв.
   */
  const toggleSession = useCallback(async () => {
    if (conversation.sessionActive) {
      await conversation.toggleSession();
      return;
    }

    if (!subscription.canTalk) {
      measureAnchor(recordRef, (point) => {
        setPaywallAnchor(point);
        setPaywallOpen(true);
      });
      return;
    }

    await subscription.useTalk();
    await conversation.toggleSession();
    // Беседа кончилась — счётчик объёма ушёл вперёд, экрану пора его перечитать.
    await subscription.refresh();
  }, [conversation, subscription]);
  /**
   * Экзамен стоит столько же, сколько беседа, и считается тем же лимитом. Якоря
   * у него нет: тема выбирается из списка, и экран покупки растёт из центра.
   */
  const allowExam = useCallback(async () => {
    if (!subscription.canTalk) {
      setPaywallAnchor(null);
      setPaywallOpen(true);
      return false;
    }
    await subscription.useTalk();
    return true;
  }, [subscription]);

  // Бесплатная беседа короткая: лимит реплик у бесплатного тарифа, у подписки — нет.
  useEffect(() => {
    conversation.setTurnLimit(
      subscription.pro === false && !UNLIMITED_TALKS ? FREE_TURNS_PER_TALK : null,
    );
  }, [conversation.setTurnLimit, subscription.pro]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<Anchor | null>(null);
  /** Сколько слов ждут повторения — считаем при каждом открытии меню. */
  const [wordsDue, setWordsDue] = useState(0);

  useEffect(() => {
    if (!menuOpen) return;
    void loadReviewCards(conversation.language).then((cards) => setWordsDue(dueCards(cards).length));
  }, [menuOpen, conversation.language]);

  /**
   * Экраны, открываемые поверх вкладки. Их ровно один слой: вкладки убрали
   * вложенность, из-за которой iOS то не поднимал клавиатуру, то оставлял
   * невидимую модалку поверх всего.
   */
  const profileScreen = useZoomScreen();
  const archiveScreen = useZoomScreen();
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  const archiveConversation = useCallback(async () => {
    await conversation.finishConversation();
    setToast(t.archivedToast);
  }, [conversation]);
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

  /**
   * В широком окне браузера шапка беседы растянута на всё окно, и домик стоит
   * в левом углу. Чтобы он не прыгал в колонку при переходе в другой раздел,
   * там он тоже в углу — поверх, а в шапке раздела вместо него пустое место
   * того же размера: заголовок остаётся по центру.
   */
  const { width: windowWidth } = useWindowDimensions();
  const buttonSize = 42 * BUTTON_SCALE;
  const cornerMenu =
    Platform.OS === 'web' &&
    IS_TABLET &&
    section !== 'talk' &&
    windowWidth >= CONTENT_MAX_WIDTH * UI_SCALE + 2 * (buttonSize + 32 * UI_SCALE);
  const sectionMenu = cornerMenu ? <View style={{ width: buttonSize, height: buttonSize }} /> : menu;

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

  // Разрешения — только после заставки и строго по очереди: сначала микрофон,
  // потом уведомления. Диалог поверх ролика ставил приложение на паузу, а два
  // одновременных запроса Android не любит — второй мог сразу вернуть отказ.
  // Расписание напоминаний живёт в системе — сверяем его с настройками при
  // каждом запуске: язык интерфейса или очередь могли смениться.
  useEffect(() => {
    if (!splashDone) return;
    void ensureMicrophone()
      .catch(() => false)
      .then(() => syncReminders())
      .catch(() => undefined);
  }, [splashDone]);

  useEffect(() => {
    if (conversation.messages.length === 0) return;
    // Новая реплика возвращает ленту вниз, даже если её листали.
    userScrolled.current = false;
    listRef.current?.scrollToEnd({ animated: true });
  }, [conversation.messages.length]);

  useEffect(() => {
    if (section === 'words' && !VOCABULARY_LANGUAGES.includes(conversation.language)) {
      setSection('talk');
    }
  }, [section, conversation.language]);

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
        {/*
          Шапка беседы — над колонкой: на планшете портрет и кнопки крупные, им
          нужна вся ширина экрана. На телефоне шапка сама держит ширину колонки.
        */}
        {section === 'talk' && (
          <TalkHeader
            menu={menu}
            portrait={<TutorStrip status={conversation.status} topicId={conversation.topicId} />}
            canArchive={conversation.messages.length > 0 && !conversation.sessionActive}
            onArchive={() => void archiveConversation()}
            archiveCount={conversation.archive.length}
            onOpenArchive={() => archiveScreen.show(null)}
          />
        )}

        {/* Колонка фиксированной ширины: на планшете растягивать ленту нельзя. */}
        <View style={styles.column}>
          {section === 'talk' && (
            <>

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
                      onExplain={conversation.explain}
                    />
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyBox}>
                      <Text style={styles.emptyTitle}>{t.emptyChatTitle}</Text>
                      <Text style={styles.empty}>{t.emptyChat}</Text>
                    </View>
                  }
                />
              ) : (
                <View style={styles.list}>
                  <ActivityIndicator color={theme.neon} />
                </View>
              )}

              {/* Бесплатная беседа кончилась по лимиту реплик — говорим, что дальше. */}
              {!conversation.sessionActive && conversation.turnLimitHit && (
                <View style={styles.remind}>
                  <Text style={styles.remindText}>{t.freeTalkEnded(FREE_TURNS_PER_TALK)}</Text>
                  <View style={styles.remindRow}>
                    <Pressable
                      onPress={() => {
                        setPaywallAnchor(null);
                        setPaywallOpen(true);
                      }}
                      style={styles.remindButton}
                    >
                      <Text style={styles.remindLabel}>{t.subscription}</Text>
                    </Pressable>
                  </View>
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

            </>
          )}

          {section === 'listen' && (
            <ListeningScreen
              menu={sectionMenu}
              language={conversation.language}
              level={conversation.level}
              topicId={conversation.topicId}
            />
          )}

          {section === 'write' && (
            <WritingScreen
              menu={sectionMenu}
              language={conversation.language}
              level={conversation.level}
              topicId={conversation.topicId}
            />
          )}

          {section === 'words' && (
            <VocabularyScreen
              menu={sectionMenu}
              language={conversation.language}
              level={conversation.level}
              topicId={conversation.topicId}
            />
          )}

          {section === 'grammar' && (
            <GrammarScreen menu={sectionMenu} language={conversation.language} level={conversation.level} />
          )}

          {section === 'exam' && (
            <ExamScreen
              menu={sectionMenu}
              language={conversation.language}
              level={conversation.level}
              profile={conversation.profile}
              turnMode={conversation.turnMode}
              onToggleMode={() =>
                void conversation.setTurnMode(
                  conversation.turnMode === 'auto' ? 'manual' : 'auto',
                )
              }
              speechRate={conversation.speechRate}
              talkBusy={conversation.sessionActive}
              onBeforeStart={allowExam}
              onSessionEnd={() => void subscription.refresh()}
            />
          )}

          {section === 'book' && <NotebookScreen menu={sectionMenu} />}

          {section === 'settings' && (
            <SettingsScreen
              menu={sectionMenu}
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
              speechRate={conversation.speechRate}
              onSelectRate={conversation.setSpeechRate}
              accountEmail={account.email}
              onOpenAccount={accountScreen.show}
              pro={subscription.pro}
              tier={subscription.tier}
              talksLeft={subscription.left}
              used={subscription.used}
              onOpenPaywall={(point) => {
                setPaywallAnchor(point);
                setPaywallOpen(true);
              }}
            />
          )}
        </View>

        {/*
          Кнопка беседы — под колонкой, как шапка над ней: своя ширина, не
          зависящая от ленты.
        */}
        {section === 'talk' && (
          <View
            ref={recordRef}
            collapsable={false}
            style={styles.recordRow}
          >
            <RecordButton
              status={conversation.status}
              sessionActive={conversation.sessionActive}
              durationMillis={conversation.durationMillis}
              mode={conversation.turnMode}
              onToggleSession={toggleSession}
              onEndTurn={conversation.endTurn}
              onBeginTurn={conversation.beginTurn}
              inputLevel={conversation.inputLevel}
              onToggleMode={() =>
                void conversation.setTurnMode(conversation.turnMode === 'auto' ? 'manual' : 'auto')
              }
            />
          </View>
        )}

        {menuOpen && (
          <ScreenMenu
            current={section}
            // Слова открыты не для всех языков — закрытые из списка убираем.
            hidden={VOCABULARY_LANGUAGES.includes(conversation.language) ? [] : ['words']}
            badges={{ words: wordsDue }}
            anchor={menuAnchor}
            onSelect={setSection}
            onClose={() => setMenuOpen(false)}
          />
        )}
        <Toast message={toast} onHide={hideToast} />
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

      <Paywall
        visible={paywallOpen}
        anchor={paywallAnchor}
        left={subscription.left}
        used={subscription.used}
        block={subscription.block}
        tier={subscription.tier}
        onClose={() => setPaywallOpen(false)}
        onBought={() => void subscription.refresh()}
      />

      {cornerMenu && (
        <View style={{ position: 'absolute', top: 8 * UI_SCALE, left: 16 * UI_SCALE, zIndex: 5 }}>{menu}</View>
      )}

      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}
    </SafeAreaProvider>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    column: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
    recordRow: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },

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
    /** Пустая беседа — первое, что видит человек: Мадам Поли представляется. */
    emptyBox: { gap: 10, paddingHorizontal: 24 },
    emptyTitle: { color: theme.text, textAlign: 'center', fontSize: 22, fontWeight: '700' },
    empty: {
      color: theme.textMuted,
      textAlign: 'center',
      fontSize: 14,
      lineHeight: 20,
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
