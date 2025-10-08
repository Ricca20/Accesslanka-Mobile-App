import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Chip,
  useTheme,
  HelperText,
} from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

export default function CreatePostModal({ visible, onDismiss, onSubmit }) {
  const theme = useTheme()
  const [category, setCategory] = useState('discussion')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const categories = [
    { key: 'questions', label: 'Question', icon: 'help-circle' },
    { key: 'reviews', label: 'Review', icon: 'star' },
    { key: 'tips', label: 'Tip', icon: 'lightbulb' },
    { key: 'events', label: 'Event', icon: 'calendar' },
    { key: 'discussion', label: 'Discussion', icon: 'forum' },
  ]

  const validateForm = () => {
    const newErrors = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must not exceed 200 characters'
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required'
    } else if (content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters'
    } else if (content.trim().length > 10000) {
      newErrors.content = 'Content must not exceed 10,000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const postData = {
        category,
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
        image_urls: [],
      }

      await onSubmit(postData)
      handleClear()
      onDismiss()
    } catch (error) {
      console.error('Error submitting post:', error)
      setErrors({ submit: 'Failed to create post. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setCategory('discussion')
    setTitle('')
    setContent('')
    setTags('')
    setErrors({})
  }

  const handleDismiss = () => {
    handleClear()
    onDismiss()
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text variant="headlineSmall" style={[styles.headerTitle, { color: theme.colors.primary }]}>
                Create a Post
              </Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                Share your thoughts, questions, or experiences
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Category *
              </Text>
              <View style={styles.categoryContainer}>
                {categories.map((cat) => (
                  <Chip
                    key={cat.key}
                    icon={cat.icon}
                    selected={category === cat.key}
                    onPress={() => setCategory(cat.key)}
                    style={styles.categoryChip}
                    mode={category === cat.key ? 'flat' : 'outlined'}
                    selectedColor={theme.colors.primary}
                  >
                    {cat.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Title Input */}
            <View style={styles.section}>
              <TextInput
                label="Title *"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                placeholder="Enter a descriptive title..."
                error={!!errors.title}
                maxLength={200}
                style={styles.input}
              />
              <HelperText type="error" visible={!!errors.title}>
                {errors.title}
              </HelperText>
              <HelperText type="info" visible={!errors.title}>
                {title.length}/200 characters
              </HelperText>
            </View>

            {/* Content Input */}
            <View style={styles.section}>
              <TextInput
                label="Content *"
                value={content}
                onChangeText={setContent}
                mode="outlined"
                placeholder="Share your thoughts, questions, or experiences..."
                error={!!errors.content}
                multiline
                numberOfLines={8}
                maxLength={10000}
                style={[styles.input, styles.contentInput]}
              />
              <HelperText type="error" visible={!!errors.content}>
                {errors.content}
              </HelperText>
              <HelperText type="info" visible={!errors.content}>
                {content.length}/10,000 characters
              </HelperText>
            </View>

            {/* Tags Input */}
            <View style={styles.section}>
              <TextInput
                label="Tags (optional)"
                value={tags}
                onChangeText={setTags}
                mode="outlined"
                placeholder="Enter tags separated by commas (e.g., wheelchair, ramps, parking)"
                style={styles.input}
                left={<TextInput.Icon icon="tag-multiple" />}
              />
              <HelperText type="info">
                Add relevant tags to help others find your post
              </HelperText>
            </View>

            {/* Submit Error */}
            {errors.submit && (
              <HelperText type="error" visible style={styles.submitError}>
                {errors.submit}
              </HelperText>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={handleDismiss}
                style={styles.actionButton}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                loading={loading}
                disabled={loading}
                icon="send"
              >
                Post
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  keyboardAvoid: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '500',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
  },
  contentInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  submitError: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
})
