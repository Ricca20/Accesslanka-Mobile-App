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

export default function ChatbotScreen({ navigation }) {
  const theme = useTheme()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const flatListRef = useRef(null)

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
          <Avatar.Icon
            size={40}
            icon="account"
            style={styles.avatar}
            color={theme.colors.primary}
          />
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
                  activeOpacity={0.7}
                >
                  <Card style={styles.placeCard} mode="outlined">
                    <Card.Content>
                      <View style={styles.placeHeader}>
                        <View style={styles.placeInfo}>
                          <Title style={styles.placeTitle}>{place.name}</Title>
                          <Paragraph style={styles.placeCategory}>
                            {place.category?.replace('s', '') || 'Place'}
                          </Paragraph>
                        </View>
                        {place.verified && (
                          <Icon name="check-decagram" size={20} color={theme.colors.primary} />
                        )}
                      </View>
                      
                      <View style={styles.placeDetails}>
                        <View style={styles.placeDetailRow}>
                          <Icon name="map-marker" size={16} color={theme.colors.primary} />
                          <Paragraph style={styles.placeAddress} numberOfLines={1}>
                            {place.address}
                          </Paragraph>
                        </View>
                        
                        {place.distance && (
                          <View style={styles.placeDetailRow}>
                            <Icon name="map-marker-distance" size={16} color={theme.colors.secondary} />
                            <Text style={styles.distanceText}>{formatDistance(place.distance)}</Text>
                          </View>
                        )}
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
        <View style={[styles.messageBubble, styles.botBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={styles.typingIndicator}>
            <View style={[styles.typingDot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.colors.onSurfaceVariant }]} />
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
    backgroundColor: '#f0f0f0',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  botContent: {
    flex: 1,
    marginRight: 40,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
    maxWidth: '80%',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  userBubble: {
    backgroundColor: '#048221ff',
    borderBottomRightRadius: 12,
    marginRight: 8,
  },
  botBubble: {
    backgroundColor: '#E0E0E0',
    borderBottomLeftRadius: 12,
    marginLeft: 8,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  botMessageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  placesContainer: {
    marginTop: 12,
    marginLeft: 8,
  },
  placeCard: {
    marginBottom: 12,
    borderRadius: 16,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeInfo: {
    flex: 1,
  },
  placeTitle: {
    fontSize: 18,
    marginBottom: 4,
    fontWeight: '600',
  },
  placeCategory: {
    fontSize: 14,
    textTransform: 'capitalize',
    opacity: 0.7,
  },
  placeDetails: {
    marginTop: 8,
  },
  placeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  placeAddress: {
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600',
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
    padding: 4,
  },
  typingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 3,
    opacity: 0.6,
  },
  suggestionsContainer: {
    padding: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  suggestionsTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  suggestionChip: {
    marginRight: 10,
  },
  inputContainer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    borderRadius: 12,
    margin: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'transparent',
    maxHeight: 100,
    paddingLeft: 12,
    fontSize: 16,
    lineHeight: 22,
  },
})
