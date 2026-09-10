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
import { ArchiveIcon, MoonIcon, SunIcon } from './src/components/icons';
import { HomeworkScreen } from './src/components/HomeworkScreen';
import { ListeningScreen } from './src/components/ListeningScreen';
import { NotebookScreen } from './src/components/NotebookScreen';
import { ProfileScreen } from './src/components/ProfileScreen';
import { RecordButton } from './src/components/RecordButton';
import { TutorStrip } from './src/components/TutorStrip';
import { LANGUAGES } from './src/languages';
import { findTopic } from './src/topics';
import { CONTENT_MAX_WIDTH } from './src/layout';
import { useConversation } from './src/hooks/useConversation';
import { useZoomScreen } from './src/hooks/useZoomScreen';
import { ZOOM_OPEN_MS } from './src/components/ZoomModal';
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
  const [panelOpen, setPanelOpen] = useState(false);
  // Каждый экран помнит значок, из которого его открыли: в него он и схлопнется.
  const archiveScreen = useZoomScreen();
  const profileScreen = useZoomScreen();
  const homeworkScreen = useZoomScreen();
  const notebookScreen = useZoomScreen();
  const listeningScreen = useZoomScreen();

  // Начали беседу — убираем панель и все открытые экраны: разговор идёт на
  // чистом окне, иначе первую реплику слушаешь, глядя в настройки.
  useEffect(() => {
    if (!conversation.sessionActive) return;
    setPanelOpen(false);
    archiveScreen.hide();
    profileScreen.hide();
    homeworkScreen.hide();
    notebookScreen.hide();
    listeningScreen.hide();
  }, [
    conversation.sessionActive,
    archiveScreen.hide,
    profileScreen.hide,
    homeworkScreen.hide,
    notebookScreen.hide,
    listeningScreen.hide,
  ]);

  /**
   * Задание живёт внутри экрана настроек, поэтому открываем его в два шага:
   * сперва настройки, затем — когда они развернулись — само задание. iOS
   * поднимает вложенную модалку поверх, но не во время чужой анимации.
   */
  const openTask = () => {
    setPanelOpen(true);
    setTimeout(() => homeworkScreen.show(null), ZOOM_OPEN_MS + 60);
  };

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
          onOpenArchive={archiveScreen.show}
          profileName={conversation.profile.name}
          onOpenProfile={profileScreen.show}
          homeworkCount={conversation.homework?.exercises.length ?? null}
          onOpenHomework={homeworkScreen.show}
          englishVariant={conversation.englishVariant}
          onSelectVariant={conversation.setEnglishVariant}
          onOpenNotebook={notebookScreen.show}
          onOpenListening={listeningScreen.show}
          screens={
            <>
              <ListeningScreen
                visible={listeningScreen.open}
                anchor={listeningScreen.anchor}
                language={conversation.language}
                level={conversation.level}
                topicId={conversation.topicId}
                onClose={listeningScreen.hide}
              />

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
            </>
          }
          leading={<TutorStrip status={conversation.status} topicId={conversation.topicId} />}
          trailing={
            <View style={styles.actions}>
              <Pressable
                onPress={conversation.finishConversation}
                disabled={conversation.messages.length === 0 || conversation.sessionActive}
                accessibilityLabel={t.toArchive}
                hitSlop={12}
                style={[
                  styles.iconButton,
                  (conversation.messages.length === 0 || conversation.sessionActive) &&
                    styles.iconButtonOff,
                ]}
              >
                <ArchiveIcon size={22} color={theme.accent} />
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
              <Pressable onPress={openTask} style={styles.remindButton}>
                <Text style={styles.remindLabel}>{t.task}</Text>
              </Pressable>
              <Pressable
                onPress={() => notebookScreen.show(null)}
                style={styles.remindButton}
              >
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
            void conversation.setTurnMode(conversation.turnMode === 'auto' ? 'manual' : 'auto')
          }
        />
        </View>
        <NotebookScreen
          visible={notebookScreen.open}
          anchor={notebookScreen.anchor}
          onClose={notebookScreen.hide}
        />

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
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
    remindLabel: { color: theme.accent, fontSize: 13, fontWeight: '700' },
    column: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surfaceAlt,
    },
    /** Архивировать нечего или идёт беседа — кнопка гаснет, но остаётся на месте. */
    iconButtonOff: { opacity: 0.35 },
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
