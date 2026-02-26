import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Enums ---
export enum ConversationCategory {
  ACADEMIC = 'ACADEMIC',
  PRIVATE = 'PRIVATE',
}

export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

// --- Interfaces ---
export interface IUser extends Document {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse extends Document {
  name: string;
  code: string;
  userId: mongoose.Types.ObjectId | IUser; // The student managing/taking the course
}

export interface IConversation extends Document {
  title: string;
  category: ConversationCategory;
  userId: mongoose.Types.ObjectId | IUser;
  courseId?: mongoose.Types.ObjectId | ICourse; // Only present if ACADEMIC
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId | IConversation;
  role: Role;
  content: string;
  createdAt: Date;
}

// --- Schemas ---
const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const CourseSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const ConversationSchema: Schema = new Schema(
  {
    title: { type: String, required: true, default: 'New Conversation' },
    category: {
      type: String,
      enum: Object.values(ConversationCategory),
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: function (this: IConversation) {
        return this.category === ConversationCategory.ACADEMIC;
      },
    },
  },
  { timestamps: true }
);

const MessageSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  role: { type: String, enum: Object.values(Role), required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// --- Models ---
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
export const Conversation: Model<IConversation> = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);