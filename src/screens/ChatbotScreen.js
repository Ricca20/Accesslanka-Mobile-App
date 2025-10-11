import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native'
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Chip,
  useTheme,
  Avatar,
  Text,
} from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import * as Location from 'expo-location'
import { ChatbotService } from '../services/ChatbotService'
import { useAuth } from '../context/AuthContext'

export default function ChatbotScreen({ navigation }) {
  const theme = useTheme()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const flatListRef = useRef(null)
  const typingAnim1 = useRef(new Animated.Value(0)).current
  const typingAnim2 = useRef(new Animated.Value(0)).current
  const typingAnim3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Get user location
    getUserLocation()
    
    // Add welcome message
    addBotMessage(
      "Hello! I'm your AccessLanka assistant. I can help you find accessible places. Try asking me about restaurants, hotels, parks, or accessibility features!",
      [],
      ChatbotService.getDefaultSuggestions()
    )
  }, [])

  useEffect(() => {
    if (isTyping) {
      // Animated typing dots
      const createDotAnimation = (animValue, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        )
      }

      const anim1 = createDotAnimation(typingAnim1, 0)
      const anim2 = createDotAnimation(typingAnim2, 150)
      const anim3 = createDotAnimation(typingAnim3, 300)

      anim1.start()
      anim2.start()
      anim3.start()

      return () => {
        anim1.stop()
        anim2.stop()
        anim3.stop()
        typingAnim1.setValue(0)
        typingAnim2.setValue(0)
        typingAnim3.setValue(0)
      }
    }
  }, [isTyping])

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({})
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      }
    } catch (error) {
      console.error('Error getting location:', error)
    }
  }

  const addUserMessage = (text) => {
    const userMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
  }

  const addBotMessage = (text, places = [], newSuggestions = []) => {
    const botMessage = {
      id: (Date.now() + 1).toString(),
      text,
      isUser: false,
      timestamp: new Date(),
      places,
    }
    setMessages((prev) => [...prev, botMessage])
    if (newSuggestions.length > 0) {
      setSuggestions(newSuggestions)
    }
  }

  const handleSend = async (message = inputText) => {
    if (!message.trim()) return

    const userMessage = message.trim()
    addUserMessage(userMessage)
    setInputText('')
    setIsTyping(true)

    try {
      const response = await ChatbotService.processMessage(userMessage, userLocation)
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        addBotMessage(response.message, response.places, response.suggestions)
        setIsTyping(false)
      }, 500)
    } catch (error) {
      console.error('Error processing message:', error)
      addBotMessage(
        "I'm sorry, I encountered an error. Please try again.",
        [],
        ChatbotService.getDefaultSuggestions()
      )
      setIsTyping(false)
    }
  }

  const handleSuggestionPress = (suggestion) => {
    handleSend(suggestion)
  }

  const handlePlacePress = (place) => {
    navigation.navigate('PlaceDetails', { place })
  }

  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m away`
    }
    return `${(distance / 1000).toFixed(1)}km away`
  }

  const renderMessage = ({ item }) => {
    if (item.isUser) {
      return (
        <View style={[styles.messageContainer, styles.userMessageContainer]}>
          <View style={[styles.messageBubble, styles.userBubble, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.userMessageText}>{item.text}</Text>
          </View>
          {user?.avatar_url ? (
            <Avatar.Image
              size={40}
              source={{ uri: user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon
              size={40}
              icon="account"
              style={styles.avatar}
              color={theme.colors.primary}
            />
          )}
        </View>
      )
    }

    return (
      <View style={[styles.messageContainer, styles.botMessageContainer]}>
        <Avatar.Icon
          size={40}
          icon="robot"
          style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
          color={theme.colors.primary}
        />
        <View style={styles.botContent}>
          <View style={[styles.messageBubble, styles.botBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text style={[styles.botMessageText, { color: theme.colors.onSurface }]}>{item.text}</Text>
          </View>
          
          {item.places && item.places.length > 0 && (
            <View style={styles.placesContainer}>
              {item.places.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  onPress={() => handlePlacePress(place)}
                  activeOpacity={0.8}
                  style={styles.placeCardTouchable}
                >
                  <Card style={styles.placeCard} mode="elevated">
                    <Card.Content style={styles.placeCardContent}>
                      <View style={styles.placeHeader}>
                        <View style={styles.placeInfo}>
                          <View style={styles.placeTitleRow}>
                            <Title style={styles.placeTitle}>{place.name}</Title>
                            {place.verified && (
                              <Icon name="check-decagram" size={22} color="#048221ff" />
                            )}
                          </View>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.placeCategory}>
                              {place.category?.replace('s', '') || 'Place'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.placeDetails}>
                        <View style={styles.placeDetailRow}>
                          <View style={styles.iconCircle}>
                            <Icon name="map-marker" size={14} color="#048221ff" />
                          </View>
                          <Paragraph style={styles.placeAddress} numberOfLines={2}>
                            {place.address}
                          </Paragraph>
                        </View>
                        
                        {place.distance && (
                          <View style={styles.placeDetailRow}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                              <Icon name="map-marker-distance" size={14} color="#048221ff" />
                            </View>
                            <Text style={styles.distanceText}>{formatDistance(place.distance)}</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.viewDetailsHint}>
                        <Text style={styles.viewDetailsText}>Tap to view details</Text>
                        <Icon name="chevron-right" size={16} color="#048221ff" />
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderTypingIndicator = () => {
    if (!isTyping) return null

    return (
      <View style={[styles.messageContainer, styles.botMessageContainer]}>
        <Avatar.Icon
          size={40}
          icon="robot"
          style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
          color={theme.colors.primary}
        />
        <View style={[styles.messageBubble, styles.botBubble]}>
          <View style={styles.typingIndicator}>
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: typingAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [
                    {
                      translateY: typingAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -4],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: typingAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [
                    {
                      translateY: typingAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -4],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.typingDot,
                {
                  opacity: typingAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [
                    {
                      translateY: typingAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -4],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        onLayout={() => flatListRef.current?.scrollToEnd()}
        ListFooterComponent={renderTypingIndicator}
      />

      {suggestions.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.suggestionsTitle, { color: theme.colors.onSurfaceVariant }]}>
            Suggested questions:
          </Text>
          <FlatList
            horizontal
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Chip
                mode="outlined"
                onPress={() => handleSuggestionPress(item)}
                style={styles.suggestionChip}
                icon="chat-question"
              >
                {item}
              </Chip>
            )}
          />
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
        <TextInput
          mode="outlined"
          placeholder="Ask me anything..."
          value={inputText}
          onChangeText={setInputText}
          style={styles.input}
          right={
            <TextInput.Icon
              icon="send"
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
              color={inputText.trim() && !isTyping ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          }
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          multiline
          maxLength={500}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  botContent: {
    flex: 1,
    marginRight: 48,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 20,
    maxWidth: '85%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#048221ff',
    borderBottomRightRadius: 4,
    marginRight: 8,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
  },
  botMessageText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#2C2C2C',
  },
  placesContainer: {
    marginTop: 16,
    marginLeft: 8,
  },
  placeCardTouchable: {
    marginBottom: 14,
  },
  placeCard: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  placeCardContent: {
    padding: 16,
  },
  placeHeader: {
    marginBottom: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginBottom: 0,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  placeCategory: {
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#048221ff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placeDetails: {
    marginBottom: 12,
  },
  placeDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  placeAddress: {
    fontSize: 14,
    flex: 1,
    color: '#555',
    lineHeight: 20,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#048221ff',
    marginTop: 4,
  },
  viewDetailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  viewDetailsText: {
    fontSize: 13,
    color: '#048221ff',
    fontWeight: '600',
    marginRight: 4,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    alignItems: 'center',
  },
  featureChip: {
    marginRight: 10,
    marginBottom: 8,
    height: 30,
    borderRadius: 16,
  },
  featureChipText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  moreFeatures: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: '#999',
    opacity: 0.7,
  },
  suggestionsContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
  },
  suggestionsTitle: {
    fontSize: 13,
    marginBottom: 10,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionChip: {
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderColor: '#048221ff',
  },
  inputContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    backgroundColor: '#F8F8F8',
    maxHeight: 100,
    fontSize: 15,
    lineHeight: 21,
  },
})
